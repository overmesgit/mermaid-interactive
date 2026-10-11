# Show the machine

For code, show what runs, in what order, and what changes, one step at a time.

## Why

Readers of code fail less on syntax than on what the code *does* when it runs. They need a working model of the machine: where data lives, what is called next, what is waiting, what changed. Without that model, they guess, and guesses about running code are often wrong (for example, that an `await` blocks the whole program, or that a variable keeps its value between requests).

## How

- Pick one concrete input and follow it through. Name the value at each step.
- Show state, not only structure: what is in memory, in the database, in the queue, after each step.
- Say who acts and who waits. Mark the places where control leaves and comes back (calls, callbacks, events, network).
- Use a sequence or state diagram for the run, and a structure diagram only for where things live.
- Keep the model as simple as the question allows. Say what it leaves out.

## Example

Explaining the bookshop login: one reader, one password. Step 1, the web app posts the form to the API. Step 2, the API asks Postgres for the user by email. Step 3, Postgres returns the row with the password hash, and the API compares hashes. The database never answers yes or no. Step 4, the API sets a session cookie, and the browser keeps it for the next call. At each step, say what each side holds: the typed password, the hash, the cookie.

## Watch out

- A structure picture (boxes for modules) looks like an explanation of behavior but is not one.
- A model that is too simple becomes a wrong idea later. Say "this ignores concurrency for now."

Based on: notional machines in programming education (du Boulay; Sorva).
