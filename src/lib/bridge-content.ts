/**
 * Bridge curriculum content + the diagnosis contract.
 *
 * The prototype answers `diagnose()` locally with hand-written, realistic
 * misconception output. The function is async and returns a typed
 * `Diagnosis`, so a real LLM call (Grok / Hugging Face) can replace the body
 * of `diagnose()` without touching any UI code.
 */

export type ConceptId = "select" | "join" | "groupby" | "nulls" | "subqueries";

export interface Concept {
  id: ConceptId;
  name: string;
  blurb: string;
  academic: {
    prompt: string;
    options: { id: string; text: string }[];
    correct: string;
    why: string;
  };
  apply: {
    scenario: string;
    schema: string[];
    task: string;
    starter: string;
    /** lowercase fragments the query must contain to count as transferred */
    required: string[];
    /** fragments that indicate the classic mistake for this concept */
    trap: string[];
    solution: string;
  };
  verify: {
    scenario: string;
    task: string;
    starter: string;
    required: string[];
    solution: string;
  };
}

export interface Diagnosis {
  label: string;
  confidence: number;
  plainLanguage: string;
  followUp: { question: string; options: string[] };
  explanation: string;
  counterexample: { title: string; body: string; sql: string };
}

export const CONCEPTS: Concept[] = [
  {
    id: "select",
    name: "SELECT & Filtering",
    blurb: "Projecting columns and narrowing rows without quietly dropping data.",
    academic: {
      prompt: "Which clause decides which rows come back, rather than which columns?",
      options: [
        { id: "a", text: "SELECT" },
        { id: "b", text: "WHERE" },
        { id: "c", text: "ORDER BY" },
        { id: "d", text: "LIMIT" },
      ],
      correct: "b",
      why: "SELECT chooses columns; WHERE filters rows before grouping happens.",
    },
    apply: {
      scenario:
        "Ravel Supply's ops team wants a shortlist of orders to chase today: anything placed in the last 7 days that still hasn't shipped.",
      schema: ["orders(id, customer_id, total, status, created_at)"],
      task: "Return id, total and created_at for unshipped orders from the last 7 days, newest first.",
      starter: "select\nfrom orders\n",
      required: ["select", "from orders", "where", "status", "order by"],
      trap: ["status = 'shipped'"],
      solution:
        "select id, total, created_at\nfrom orders\nwhere status <> 'shipped'\n  and created_at > now() - interval '7 days'\norder by created_at desc;",
    },
    verify: {
      scenario: "Finance wants the same list, but only orders above ₹2,000.",
      task: "Return id and total for unshipped orders over 2000, highest value first.",
      starter: "select\nfrom orders\n",
      required: ["select", "where", "total", "order by"],
      solution:
        "select id, total\nfrom orders\nwhere status <> 'shipped' and total > 2000\norder by total desc;",
    },
  },
  {
    id: "join",
    name: "JOIN",
    blurb: "Combining tables without silently deleting the rows that don't match.",
    academic: {
      prompt: "What rows does an INNER JOIN return?",
      options: [
        { id: "a", text: "Every row from the left table, matched or not" },
        { id: "b", text: "Only rows that have a match on both sides" },
        { id: "c", text: "Every row from both tables" },
        { id: "d", text: "Only rows where the join column is NULL" },
      ],
      correct: "b",
      why: "An inner join keeps matched pairs only — unmatched rows disappear from both sides.",
    },
    apply: {
      scenario:
        "An e-commerce support tool lists customers with how much they've spent. Marketing specifically wants to see the customers who have spent nothing yet, so they can be re-engaged.",
      schema: [
        "customers(id, name, signed_up_at)",
        "orders(id, customer_id, amount, created_at)",
      ],
      task: "Return every customer's name and their total spend — including customers with zero orders (show 0, not a blank row).",
      starter: "select c.name, sum(o.amount) as total\nfrom customers c\n",
      required: ["left join", "group by"],
      trap: ["inner join", "is not null", "where o."],
      solution:
        "select c.name, coalesce(sum(o.amount), 0) as total\nfrom customers c\nleft join orders o on o.customer_id = c.id\ngroup by c.id, c.name\norder by total desc;",
    },
    verify: {
      scenario:
        "Logistics wants every order listed with its carrier. Some orders haven't shipped yet and have no row in shipments — they still need to appear.",
      task: "Return order id, total and carrier for every order, keeping unshipped orders with a blank carrier.",
      starter: "select o.id, o.total, s.carrier\nfrom orders o\n",
      required: ["left join", "shipments"],
      solution:
        "select o.id, o.total, s.carrier\nfrom orders o\nleft join shipments s on s.order_id = o.id\norder by o.id;",
    },
  },
  {
    id: "groupby",
    name: "GROUP BY / HAVING",
    blurb: "Aggregating per group, and filtering on the aggregate itself.",
    academic: {
      prompt: "Which clause filters rows after aggregation?",
      options: [
        { id: "a", text: "WHERE" },
        { id: "b", text: "HAVING" },
        { id: "c", text: "ORDER BY" },
        { id: "d", text: "DISTINCT" },
      ],
      correct: "b",
      why: "WHERE runs before grouping; HAVING is the only place you can filter on SUM, COUNT or AVG.",
    },
    apply: {
      scenario:
        "A category manager wants the product categories that are genuinely selling — at least 10 orders — ranked by revenue.",
      schema: ["order_items(id, order_id, product_id, qty, price)", "products(id, name, category)"],
      task: "Return category, number of order lines and total revenue, keeping only categories with 10 or more lines.",
      starter: "select p.category\nfrom order_items i\n",
      required: ["group by", "having", "count"],
      trap: ["where count", "where sum"],
      solution:
        "select p.category, count(*) as lines, sum(i.qty * i.price) as revenue\nfrom order_items i\njoin products p on p.id = i.product_id\ngroup by p.category\nhaving count(*) >= 10\norder by revenue desc;",
    },
    verify: {
      scenario: "Now the manager only wants categories earning more than 50,000 in revenue.",
      task: "Return category and total revenue for categories above 50000.",
      starter: "select p.category\nfrom order_items i\n",
      required: ["group by", "having", "sum"],
      solution:
        "select p.category, sum(i.qty * i.price) as revenue\nfrom order_items i\njoin products p on p.id = i.product_id\ngroup by p.category\nhaving sum(i.qty * i.price) > 50000;",
    },
  },
  {
    id: "nulls",
    name: "NULL handling",
    blurb: "NULL is unknown, not zero and not empty string — comparisons with it aren't true.",
    academic: {
      prompt: "What does `price = NULL` evaluate to in Postgres?",
      options: [
        { id: "a", text: "true when price is NULL" },
        { id: "b", text: "false always" },
        { id: "c", text: "NULL (unknown), so the row is not returned" },
        { id: "d", text: "It raises an error" },
      ],
      correct: "c",
      why: "Any comparison to NULL is unknown. You need IS NULL / IS NOT NULL.",
    },
    apply: {
      scenario:
        "The catalogue team is cleaning up listings. Some products have no price recorded yet and must be found — and every product needs a display price, showing 0 when it is missing.",
      schema: ["products(id, name, category, price)"],
      task: "Return name and a display price that shows 0 when price is missing, for products whose price is missing.",
      starter: "select name, price\nfrom products\n",
      required: ["is null", "coalesce"],
      trap: ["= null", "!= null", "<> null"],
      solution:
        "select name, coalesce(price, 0) as display_price\nfrom products\nwhere price is null;",
    },
    verify: {
      scenario: "Support wants customers who never gave a phone number.",
      task: "Return name for customers whose phone is missing.",
      starter: "select name\nfrom customers\n",
      required: ["is null"],
      solution: "select name\nfrom customers\nwhere phone is null;",
    },
  },
  {
    id: "subqueries",
    name: "Subqueries",
    blurb: "Using one result set inside another — and knowing when NOT IN bites you.",
    academic: {
      prompt: "Why can `NOT IN (subquery)` return no rows unexpectedly?",
      options: [
        { id: "a", text: "Because subqueries can't be used with NOT IN" },
        { id: "b", text: "Because a NULL in the subquery makes every comparison unknown" },
        { id: "c", text: "Because NOT IN ignores indexes" },
        { id: "d", text: "Because NOT IN only works on numbers" },
      ],
      correct: "b",
      why: "One NULL in the inner list makes NOT IN unknown for every row, so nothing comes back. NOT EXISTS is safe.",
    },
    apply: {
      scenario:
        "Growth wants to email customers who have never placed an order. The orders table contains some rows with a NULL customer_id from abandoned carts.",
      schema: ["customers(id, name, email)", "orders(id, customer_id, amount)"],
      task: "Return the name and email of customers with no orders, safely handling the NULL customer_id rows.",
      starter: "select name, email\nfrom customers c\n",
      required: ["not exists"],
      trap: ["not in"],
      solution:
        "select c.name, c.email\nfrom customers c\nwhere not exists (\n  select 1 from orders o where o.customer_id = c.id\n);",
    },
    verify: {
      scenario: "Merchandising wants products that have never been ordered.",
      task: "Return product name for products with no order lines.",
      starter: "select name\nfrom products p\n",
      required: ["not exists"],
      solution:
        "select p.name\nfrom products p\nwhere not exists (\n  select 1 from order_items i where i.product_id = p.id\n);",
    },
  },
];

export function getConcept(id: string): Concept | undefined {
  return CONCEPTS.find((c) => c.id === id);
}

export function checkQuery(sql: string, required: string[]): boolean {
  const q = sql.toLowerCase().replace(/\s+/g, " ");
  return required.every((frag) => q.includes(frag));
}

/** Hand-written misconception library, keyed by concept. */
const DIAGNOSES: Record<ConceptId, Diagnosis> = {
  select: {
    label: "Misconception: filter inverted",
    confidence: 0.81,
    plainLanguage:
      "Your filter looks like it keeps the orders that already shipped — the opposite of the shortlist ops asked for. The rows you want are the ones that have NOT shipped yet.",
    followUp: {
      question: "Which rows should stay in the result?",
      options: [
        "Orders where status is 'shipped'",
        "Orders where status is anything but 'shipped'",
        "All orders, shipped or not",
      ],
    },
    explanation:
      "WHERE keeps rows that make the condition true. `status = 'shipped'` keeps shipped orders; you want `status <> 'shipped'`. Also add the 7-day window with a date comparison, and sort newest first with ORDER BY created_at DESC.",
    counterexample: {
      title: "One row, two filters",
      body: "Order 1042 shipped yesterday. With `status = 'shipped'` it appears in the chase list — which means ops would call a customer whose parcel is already on the way.",
      sql: "where status <> 'shipped'\n  and created_at > now() - interval '7 days'",
    },
  },
  join: {
    label: "Misconception: unmatched rows dropped",
    confidence: 0.87,
    plainLanguage:
      "Your approach may be excluding customers without a matching order — did you mean for that to happen? Marketing specifically wants the zero-spend customers, and an inner join (or a WHERE on the orders side) removes them before you ever see them.",
    followUp: {
      question: "A customer signed up but never ordered. What should the result show?",
      options: [
        "Nothing — they have no orders",
        "Their name with a total of 0",
        "Their name with an error",
      ],
    },
    explanation:
      "A LEFT JOIN keeps every row from the left table even when no match exists; the right-hand columns come back NULL rather than the row being deleted. Then wrap the aggregate in COALESCE so the untouched customers read as 0 instead of blank. Be careful: putting a condition on the right table in WHERE turns a left join back into an inner join.",
    counterexample: {
      title: "Priya signed up and never ordered",
      body: "With INNER JOIN, Priya vanishes and the re-engagement list is empty. With LEFT JOIN she comes back with amount NULL, and COALESCE turns that into 0 — exactly the row marketing needs.",
      sql: "left join orders o on o.customer_id = c.id\n-- keep conditions on orders inside the ON clause\ngroup by c.id, c.name",
    },
  },
  groupby: {
    label: "Misconception: aggregate filtered too early",
    confidence: 0.84,
    plainLanguage:
      "It looks like you're trying to filter on a count or sum in WHERE. At the moment WHERE runs, the groups don't exist yet — so the database has no count to compare against.",
    followUp: {
      question: "When is COUNT(*) per category actually known?",
      options: ["Before grouping", "After grouping", "It never matters"],
    },
    explanation:
      "The order is FROM → WHERE → GROUP BY → HAVING → ORDER BY. Use WHERE for raw-row conditions and HAVING for anything computed per group, such as `having count(*) >= 10`.",
    counterexample: {
      title: "Two categories, one threshold",
      body: "'Audio' has 12 lines, 'Lighting' has 3. Only HAVING can drop Lighting; WHERE count(*) >= 10 simply errors, because counts aren't computed yet.",
      sql: "group by p.category\nhaving count(*) >= 10",
    },
  },
  nulls: {
    label: "Misconception: NULL compared with =",
    confidence: 0.89,
    plainLanguage:
      "You're comparing to NULL with an equals or not-equals sign. NULL means 'unknown', so that comparison is never true — the rows you're hunting for get filtered away silently.",
    followUp: {
      question: "How do you test that a column has no value?",
      options: ["column = NULL", "column IS NULL", "column = ''"],
    },
    explanation:
      "Use IS NULL / IS NOT NULL for existence tests, and COALESCE(price, 0) when you need a substitute value for display. NULL is not zero and not an empty string.",
    counterexample: {
      title: "A product with no price",
      body: "Product 'Studio Lamp' has price NULL. `where price = null` returns nothing at all, so the catalogue team concludes the data is clean. `where price is null` finds it immediately.",
      sql: "select name, coalesce(price, 0) as display_price\nfrom products\nwhere price is null;",
    },
  },
  subqueries: {
    label: "Misconception: NOT IN with NULLs",
    confidence: 0.86,
    plainLanguage:
      "A NOT IN over a column that contains NULLs makes every comparison unknown, so your query returns nothing even though plenty of customers have never ordered.",
    followUp: {
      question: "The inner list contains one NULL. What does NOT IN return?",
      options: ["The non-matching rows", "Nothing at all", "An error"],
    },
    explanation:
      "Prefer NOT EXISTS with a correlated subquery: it asks 'is there any order for this customer?' row by row and is unaffected by NULLs. A LEFT JOIN with `where o.id is null` works too.",
    counterexample: {
      title: "One abandoned cart poisons the list",
      body: "A single orders row with customer_id NULL turns `not in (select customer_id from orders)` into an empty result. NOT EXISTS still returns every customer with no order.",
      sql: "where not exists (\n  select 1 from orders o where o.customer_id = c.id\n)",
    },
  },
};

/**
 * Swap point for the real model. Replace the body with a call to Grok or a
 * Hugging Face endpoint that returns this same `Diagnosis` shape; the concept
 * definition, the student's query and the task text are all the context the
 * prompt needs.
 */
export async function diagnose(concept: Concept, studentQuery: string): Promise<Diagnosis> {
  await new Promise((r) => setTimeout(r, 1600));
  void studentQuery;
  return DIAGNOSES[concept.id];
}
