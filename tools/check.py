"""Open a content file in the editor in Chrome, click every part and arrow of every view, and print what failed.

Usage, from the repo root:
    python3 tools/check.py examples/oauth-pkce.js [--shots DIR] [--views id,id]

It prints one line per view and the editor's problem list, and exits 1 if any click missed,
any message is not clickable, or the editor lists a problem. --shots saves a screenshot of each view.

It needs Chrome with a DevTools port. From WSL it starts Windows Chrome headless on port 9222
when none is running, and stops it at the end. Set CHROME to use another Chrome.
The repo is served on port 8765 for the run.
"""
import base64, json, os, socket, struct, subprocess, sys, time, urllib.request

PORT = 9222
SERVE = 8765
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = os.environ.get("CHROME", "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe")


class WS:
    """A small websocket client, because Python's standard library has none."""

    def __init__(self, url):
        host_port, path = url[len("ws://"):].split("/", 1)
        host, port = host_port.split(":")
        self.sock = socket.create_connection((host, int(port)), timeout=60)
        key = base64.b64encode(os.urandom(16)).decode()
        self.sock.sendall((f"GET /{path} HTTP/1.1\r\nHost: {host_port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
                           f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n").encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            buf += self.sock.recv(4096)
        self.rest = buf.split(b"\r\n\r\n", 1)[1]
        self.id = 0

    def _read(self, n):
        while len(self.rest) < n:
            chunk = self.sock.recv(1 << 16)
            if not chunk:
                raise EOFError
            self.rest += chunk
        out, self.rest = self.rest[:n], self.rest[n:]
        return out

    def _send(self, obj):
        data = json.dumps(obj).encode()
        header = bytearray([0x81])
        n = len(data)
        if n < 126:
            header.append(0x80 | n)
        elif n < 65536:
            header.append(0x80 | 126); header += struct.pack(">H", n)
        else:
            header.append(0x80 | 127); header += struct.pack(">Q", n)
        mask = os.urandom(4)
        header += mask
        self.sock.sendall(bytes(header) + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))

    def _recv(self):
        msg = b""
        while True:
            b1, b2 = self._read(2)
            n = b2 & 0x7F
            if n == 126:
                n = struct.unpack(">H", self._read(2))[0]
            elif n == 127:
                n = struct.unpack(">Q", self._read(8))[0]
            msg += self._read(n)
            if b1 & 0x80:
                return json.loads(msg)

    def call(self, method, **params):
        self.id += 1
        my = self.id
        self._send({"id": my, "method": method, "params": params})
        while True:
            m = self._recv()
            if m.get("id") == my:
                if "error" in m:
                    raise RuntimeError(m["error"])
                return m.get("result")

    def eval(self, expr):
        r = self.call("Runtime.evaluate", expression=expr, awaitPromise=True, returnByValue=True)
        if "exceptionDetails" in r:
            raise RuntimeError("page error: " + json.dumps(r["exceptionDetails"])[:1500])
        return r["result"].get("value")


def targets():
    return json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json"))


def up(url):
    try:
        urllib.request.urlopen(url, timeout=1)
        return True
    except OSError:
        return False


def start_chrome():
    """Start a headless Chrome with its own profile, so the user's Chrome is never touched."""
    profile = os.path.join(os.environ.get("TMPDIR", "/tmp"), "explainer-check-chrome")
    os.makedirs(profile, exist_ok=True)
    if CHROME.startswith("/mnt/"):
        profile = subprocess.check_output(["wslpath", "-w", profile], text=True).strip()
    proc = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={PORT}", f"--user-data-dir={profile}",
                             "--no-first-run", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(60):
        if up(f"http://127.0.0.1:{PORT}/json/version"):
            return proc
        time.sleep(0.5)
    sys.exit(f"Chrome did not open port {PORT}. Is {CHROME} right?")


def stop_chrome():
    """Stop only the Chrome this script started: the one with the DevTools port on its command line."""
    if CHROME.startswith("/mnt/"):
        subprocess.run(["powershell.exe", "-NoProfile", "-Command",
                        f"Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | "
                        f"Where-Object {{ $_.CommandLine -like '*remote-debugging-port={PORT}*' }} | "
                        f"ForEach-Object {{ Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }}"],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    args = sys.argv[1:]
    shots = views = None
    if "--shots" in args:
        i = args.index("--shots"); shots = args[i + 1]; del args[i:i + 2]
    if "--views" in args:
        i = args.index("--views"); views = args[i + 1].split(","); del args[i:i + 2]
    if len(args) != 1:
        sys.exit(__doc__)
    content = open(args[0], encoding="utf-8").read()

    server = None
    if not up(f"http://127.0.0.1:{SERVE}/index.html"):
        server = subprocess.Popen([sys.executable, "-m", "http.server", str(SERVE), "--bind", "127.0.0.1"], cwd=ROOT,
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(1)
    chrome = None if up(f"http://127.0.0.1:{PORT}/json/version") else start_chrome()
    try:
        return run(content, shots, views)
    finally:
        if chrome:
            stop_chrome()
        if server:
            server.terminate()


def run(content, shots, views):
    page = WS(next(t for t in targets() if t["type"] == "page")["webSocketDebuggerUrl"])
    page.call("Emulation.setDeviceMetricsOverride", width=1500, height=950, deviceScaleFactor=1, mobile=False)
    page.call("Page.enable")
    page.call("Page.navigate", url=f"http://127.0.0.1:{SERVE}/index.html")
    for _ in range(50):
        time.sleep(0.2)
        if page.eval("document.readyState === 'complete' && document.getElementById('notice-title').textContent === 'Open a content file'"):
            break
    else:
        sys.exit("The editor did not load. Its notice says: " + str(page.eval("document.getElementById('notice')?.textContent")))
    page.eval(f"document.getElementById('content').value = {json.dumps(content)}; document.getElementById('preview').click(); 1")

    # The preview is a sandboxed frame the editor cannot reach into, but it is its own DevTools target.
    frame = None
    for _ in range(100):
        time.sleep(0.25)
        if not frame:
            t = next((t for t in targets() if t["type"] == "iframe" and t["url"].startswith("blob:")
                      and "webSocketDebuggerUrl" in t), None)
            frame = t and WS(t["webSocketDebuggerUrl"])
        if frame and frame.eval("!!document.querySelector('#camera svg')"):
            break
    else:
        sys.exit("The preview did not draw a diagram. Editor notice: "
                 + str(page.eval("document.getElementById('notice')?.textContent")))
    time.sleep(1)

    walk = open(os.path.join(ROOT, "tools", "walk.js"), encoding="utf-8").read()
    report = frame.eval("(async () => { const sleep = (ms) => new Promise(r => setTimeout(r, ms)); const ONLY = "
                        + json.dumps(views) + ";\n" + walk + "\n})()")

    failed = False
    for vid, r in report["views"].items():
        if "error" in r:
            failed = True
            print(f"FAIL {vid}: did not draw: {r['error']}")
            continue
        bad = r["misses"] or r["unwiredMsgs"]
        failed |= bool(bad)
        print(f"{'FAIL' if bad else 'ok  '} {vid}: parts {r['nodes']}, arrows {r['edges']}, "
              f"{len(r['misses'])} missed clicks, {len(r['unwiredMsgs'])} messages not clickable")
        for m in r["misses"][:10]:
            print(f"       missed: {m}")
        if len(r["misses"]) > 10:
            print(f"       ... and {len(r['misses']) - 10} more")
        for m in r["unwiredMsgs"]:
            print(f"       not clickable: {m!r}")
        if shots:
            os.makedirs(shots, exist_ok=True)
            frame.eval(f"show({json.dumps(vid)}); 1"); time.sleep(2.5)
            out = os.path.join(shots, f"{vid}.png")
            open(out, "wb").write(base64.b64decode(page.call("Page.captureScreenshot", format="png")["data"]))
            print(f"       screenshot: {out}")
    print(f"problems: {len(report['problems'])}")
    for p in report["problems"]:
        print(f"  - {p}")
    failed |= bool(report["problems"])
    print("FAILED" if failed else "PASSED")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
