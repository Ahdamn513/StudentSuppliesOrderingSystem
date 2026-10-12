# AI-Assisted Development Documentation
**Project:** Student Supplies Ordering System

## Prompt #1: [First Prompt, the foundation and design of the website]
| Field | Details |
|---|---|

| Prompt Used | 

CONTEXT
I'm a student building a "Student Supplies Ordering System", a
browser-based app for a small school supplies shop near campus.
Customers select school supplies, manage quantities, pay with cash, and
receive a digital receipt. No database or login is needed.

Hard-coded products:
- Ballpen ₱12.00
- Pencil ₱10.00
- Notebook ₱35.00
- Yellow Pad ₱45.00
- Eraser ₱8.00
- Ruler ₱15.00

Features the app will eventually have (do NOT implement logic yet):
- Add to Cart for each product
- Cart showing name, price, quantity, subtotal, with + / - buttons and
  a Remove button
- Order summary with the total amount
- Cash payment with validation and change computation
- Digital receipt and a "New Transaction" button

TASK
Create ONLY the user interface (HTML and CSS). No JavaScript logic yet.
Include these five sections in this order:
1. Product List: all six products with name, price, and an
   "Add to Cart" button each
2. Shopping Cart: a table with columns Product, Price, Quantity,
   Subtotal, Actions, and an empty-cart placeholder row
3. Order Summary: number of items and total amount
4. Payment Section: a cash input, a "Confirm Payment" button, a change
   display, and a message area for errors
5. Receipt Section: hidden-looking placeholder area with a "New
   Transaction" button

CONSTRAINTS
- HTML and CSS only (no frameworks, no libraries, no JavaScript yet)
- Semantic HTML (header, main, section, table, label)
- Product buttons must carry data attributes (data-id, data-name,
  data-price) so JavaScript can read them later
- The payment input must be type="text" with inputmode="decimal" (so
  that non-numeric text like "abc" can be detected later, since
  type="number" hides it)
- Clear id and class names for every element JavaScript will need
- Separate files: index.html and css/style.css, plus an empty script
  tag linking js/app.js at the bottom of the body
- Clean, responsive layout for desktop and mobile
- Short comments for each section

OUTPUT FORMAT
Each file in its own code block, labeled with its path. After the
code, list the element ids and classes I'll need for JavaScript. |
![Product list interface](screenshots/Prompt1.png)

| Purpose | What I wanted the AI to accomplish |

| AI Response | Brief summary or screenshot |

| Your Evaluation | Correct, partially correct, or incorrect, and why |

| Modifications Made | Changes I made before using the output |

## Bugs Found and Fixed
| # | Bug | How I found it | Fix | Commit |
|---|---|---|---|---|

## Lessons Learned
-