# Name the wrong idea

If a common wrong idea exists, say it, show where it fails, and only then give the right one.

## Why

A reader with a wrong idea does not feel confused. They read the new explanation through the old idea and come away with a mix of the two. The new idea only wins when the old one has visibly failed, and the new one makes sense, solves that failure, and looks useful beyond it. Explaining the right idea and hoping the wrong one fades rarely works.

## How

- State the wrong idea plainly: "It is natural to think X."
- Show a case where X predicts the wrong thing. Let the reader see it fail.
- Give the right idea and show that it handles that case.
- Watch for wrong *kinds* of idea: treating a process as a thing ("the cache holds the truth"), or an outcome of many parts as one part's decision ("the load balancer decides who is slow").
- When you simplify, say what you left out. A gap the reader fills in alone becomes a new wrong idea.

## Example

Many developers think "the database transaction makes the whole checkout atomic." Show the case: payment is charged by an outside service, the transaction rolls back, the money stays charged. Then explain what actually keeps checkout consistent.

## Watch out

- Correct the idea, not the person. Use "it is natural to think", not "you are wrong".
- Old ideas come back. A long-held idea may need to be addressed again later.

Based on: conceptual change (Posner, Strike, Hewson, and Gertzog); refutation texts; Chi on category mistakes; Taber on misconceptions created by teaching.
