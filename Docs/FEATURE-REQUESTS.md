# Feature Requests

How to ask for a change to Steward so it can be picked up and built without a
round of follow-up questions.

Copy a template below, fill it in, and send it over. Paste it as-is — the
structure is the point. A request in this shape can usually go straight into a
build; a request as a sentence in a message usually costs a day of clarifying.

---

## Why the structure matters

Almost every stalled request comes down to one of three gaps:

1. **Where** — "the contacts page" could mean the list, the detail screen, or
   the workflow tab. Naming the screen and what you clicked removes the guess.
2. **What should happen instead** — describing the problem without the desired
   outcome leaves the fix to interpretation, and interpretation is where the
   wrong thing gets built.
3. **Who it affects** — a change that helps one person and a change that blocks
   the whole office are the same size in a message and very different in
   priority.

You do not need to know how it should be built. Describe the outcome you want;
the how is our side.

---

## Template — Feature request

```markdown
## Feature Request

**Requested by:**
**Date:**
**Priority:** blocking / high / normal / nice-to-have

### What I want to do that I can't today


### Where in the app
<!-- Screen name, and what you clicked to get there.
     e.g. Contacts > open a contact > Workflow & funnel tab -->


### What happens now


### What should happen instead


### Who this affects
<!-- Just me / the fiduciaries / everyone / clients -->


### Is there a workaround today?
<!-- If yes, what is it and how painful is it?
     This is what decides urgency. -->


### Anything else
<!-- Screenshots, a real example, a court deadline this ties to -->
```

---

## Template — Bug report

Use this when something exists but behaves wrongly. The difference matters: a
bug is measured against what the screen already promises, a feature against
what it does not do yet.

```markdown
## Bug Report

**Reported by:**
**Date:**
**Severity:** blocking / wrong data / annoying / cosmetic

### What I did
<!-- Numbered steps, so it can be reproduced exactly -->
1.
2.
3.

### What I expected


### What actually happened


### Does it happen every time?


### Who is affected


### Screenshot
```

---

## Priorities

Pick honestly — everything marked blocking means nothing is.

| Priority | Means |
| --- | --- |
| `blocking` | Work cannot continue. Someone is stuck right now. |
| `high` | There is a workaround, but it is costing real time daily. |
| `normal` | Worth doing. Fits into the next stretch of work. |
| `nice-to-have` | Would be better. No harm in waiting. |

For bugs, `wrong data` outranks `annoying` even when it is less irritating —
in a fiduciary practice an incorrect number on screen can end up in a court
accounting, and that is a different class of problem from a clunky screen.

---

## What happens after you send one

1. It gets read against the current build — some requests turn out to already
   exist somewhere else in the app, and that answer comes back same day.
2. Anything unclear comes back as one round of questions, not several.
3. It lands on the **Outline** page in the app under next steps, so you can see
   where it sits without asking.
4. It ships, and the Outline moves it to completed.

---

## Good and bad, side by side

**Too vague to act on**

> The contacts page needs to be better about follow-ups.

**Ready to build**

> **What I want to do that I can't today:** See which contacts I owe a
> follow-up to without opening each one.
>
> **Where:** Contacts list.
>
> **What happens now:** The list shows name, stage and matter type. I have to
> open each contact and check the Next steps tab.
>
> **What should happen instead:** A column or badge on the list showing the
> next follow-up date, and the ability to sort by it.
>
> **Who this affects:** The fiduciaries, every morning.
>
> **Workaround:** Opening contacts one at a time. Roughly 20 minutes a day.

The second one is not longer because it is more formal. It is longer because it
answers the questions that would otherwise be asked.
