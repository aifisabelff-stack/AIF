import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase-client";
import { Expense, ExpenseCategory } from "./firestore-types";

const EXPENSES_COLLECTION = "expenses";

function firestoreToExpense(docData: Record<string, unknown>, docId: string): Expense {
  return {
    id: docId,
    date: (docData.date as { toDate?: () => Date })?.toDate?.() ?? new Date(),
    category: (docData.category as ExpenseCategory) ?? "OTROS",
    description: (docData.description as string) ?? "",
    amount: (docData.amount as number) ?? 0,
    notes: docData.notes as string | undefined,
    createdAt: (docData.createdAt as { toDate?: () => Date })?.toDate?.() ?? new Date(),
    updatedAt: (docData.updatedAt as { toDate?: () => Date })?.toDate?.() ?? new Date(),
  };
}

function expenseToFirestore(expense: Partial<Expense>) {
  const data: Record<string, unknown> = {};

  if (expense.date !== undefined) data.date = Timestamp.fromDate(new Date(expense.date));
  if (expense.category !== undefined) data.category = expense.category;
  if (expense.description !== undefined) data.description = expense.description;
  if (expense.amount !== undefined) data.amount = expense.amount;
  if (expense.notes !== undefined) data.notes = expense.notes || null;

  return data;
}

export async function createExpense(
  expenseData: Omit<Expense, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const expenseId = doc(collection(db, EXPENSES_COLLECTION)).id;
  const now = Timestamp.now();

  await setDoc(doc(db, EXPENSES_COLLECTION, expenseId), {
    ...expenseToFirestore(expenseData),
    createdAt: now,
    updatedAt: now,
  });

  return expenseId;
}

export async function getExpense(expenseId: string): Promise<Expense | null> {
  const docSnap = await getDoc(doc(db, EXPENSES_COLLECTION, expenseId));
  return docSnap.exists() ? firestoreToExpense(docSnap.data(), docSnap.id) : null;
}

export async function getAllExpenses(): Promise<Expense[]> {
  const q = query(collection(db, EXPENSES_COLLECTION), orderBy("date", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((d) => firestoreToExpense(d.data(), d.id));
}

export async function getExpensesSince(startDate: Date): Promise<Expense[]> {
  const q = query(
    collection(db, EXPENSES_COLLECTION),
    where("date", ">=", Timestamp.fromDate(startDate)),
    orderBy("date", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((d) => firestoreToExpense(d.data(), d.id));
}

export async function deleteExpense(expenseId: string): Promise<void> {
  await deleteDoc(doc(db, EXPENSES_COLLECTION, expenseId));
}

export async function sumAllExpenses(): Promise<number> {
  const expenses = await getAllExpenses();
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export async function sumExpensesInRange(startDate: Date, endDate: Date): Promise<number> {
  const expenses = await getExpensesSince(startDate);
  return expenses
    .filter((e) => e.date <= endDate)
    .reduce((sum, e) => sum + e.amount, 0);
}
