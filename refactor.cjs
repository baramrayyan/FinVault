const fs = require('fs');
const path = './src/context/FinanceContext.jsx';
let content = fs.readFileSync(path, 'utf8');

// Imports
content = content.replace(
  "import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';",
  "import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';\nimport { useAuth } from './AuthContext';"
);

// Add currentUser to FinanceProvider
content = content.replace(
  "export const FinanceProvider = ({ children }) => {",
  "export const FinanceProvider = ({ children }) => {\n  const { currentUser } = useAuth();"
);

// Update useEffect dependency array
content = content.replace(
  "}, []);",
  "}, [currentUser]);"
);

// setupListeners mock check and unauth check
content = content.replace(
  /if \(db\.app\.options\.apiKey === "YOUR_API_KEY"\) \{\s*console\.warn\("Using mock data\."\);\s*setLoading\(false\);\s*return;\s*\}/g,
  `if (!currentUser) {
          setTransactions([]);
          setDebts([]);
          setSideAccounts([]);
          setSideAccountTxs([]);
          setLoading(false);
          return;
        }
        if (db.app.options.apiKey === "YOUR_API_KEY") {
          console.warn("Using mock data.");
          setLoading(false);
          return;
        }`
);

// onSnapshot calls
content = content.replace(
  `unsubTransactions = onSnapshot(collection(db, "transactions"), (snapshot) => {`,
  `unsubTransactions = onSnapshot(query(collection(db, "transactions"), where("uid", "==", currentUser.uid)), (snapshot) => {`
);
content = content.replace(
  `unsubDebts = onSnapshot(collection(db, "debts"), (snapshot) => {`,
  `unsubDebts = onSnapshot(query(collection(db, "debts"), where("uid", "==", currentUser.uid)), (snapshot) => {`
);
content = content.replace(
  `unsubBusiness = onSnapshot(collection(db, "sideAccount_transactions"), (snapshot) => {`,
  `unsubBusiness = onSnapshot(query(collection(db, "sideAccount_transactions"), where("uid", "==", currentUser.uid)), (snapshot) => {`
);
content = content.replace(
  `unsubBusinesses = onSnapshot(collection(db, "sideAccounts"), (snapshot) => {`,
  `unsubBusinesses = onSnapshot(query(collection(db, "sideAccounts"), where("uid", "==", currentUser.uid)), (snapshot) => {`
);
content = content.replace(
  `unsubSettings = onSnapshot(collection(db, "settings"), (snapshot) => {`,
  `unsubSettings = onSnapshot(collection(db, \`users/\${currentUser.uid}/settings\`), (snapshot) => {`
);

// addDoc calls (add uid)
content = content.replace(
  `const txWithTimestamp = { ...transaction, dateAdded: Date.now() };`,
  `const txWithTimestamp = { ...transaction, dateAdded: Date.now(), uid: currentUser.uid };`
);
content = content.replace(
  `await addDoc(collection(db, "debts"), debt);`,
  `await addDoc(collection(db, "debts"), { ...debt, uid: currentUser.uid });`
);
content = content.replace(
  `await addDoc(collection(db, "sideAccount_transactions"), tx);`,
  `await addDoc(collection(db, "sideAccount_transactions"), { ...tx, uid: currentUser.uid });`
);
content = content.replace(
  `await addDoc(collection(db, "sideAccounts"), account);`,
  `await addDoc(collection(db, "sideAccounts"), { ...account, uid: currentUser.uid });`
);
content = content.replace(
  `await addDoc(collection(db, "completed_goals"), {`,
  `await addDoc(collection(db, "completed_goals"), {\n        uid: currentUser.uid,`
);

// update settings path
content = content.replace(
  `await setDoc(doc(db, "settings", "savings"), { goal: 0 }, { merge: true });`,
  `await setDoc(doc(db, \`users/\${currentUser.uid}/settings\`, "savings"), { goal: 0 }, { merge: true });`
);
content = content.replace(
  `await setDoc(doc(db, "settings", type), data, { merge: true });`,
  `await setDoc(doc(db, \`users/\${currentUser.uid}/settings\`, type), data, { merge: true });`
);

// getDocs queries for clearing history
content = content.replace(
  /const snapshot = await getDocs\(collection\(db, "transactions"\)\);/g,
  `const snapshot = await getDocs(query(collection(db, "transactions"), where("uid", "==", currentUser.uid)));`
);
content = content.replace(
  /const snapshot = await getDocs\(collection\(db, "debts"\)\);/g,
  `const snapshot = await getDocs(query(collection(db, "debts"), where("uid", "==", currentUser.uid)));`
);
content = content.replace(
  /const snapshot = await getDocs\(collection\(db, "sideAccount_transactions"\)\);/g,
  `const snapshot = await getDocs(query(collection(db, "sideAccount_transactions"), where("uid", "==", currentUser.uid)));`
);


fs.writeFileSync(path, content);
console.log('FinanceContext updated successfully!');
