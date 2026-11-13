
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ShieldCheck,
  LayoutDashboard,
  Network,
  Globe,
  Users,
  Monitor,
  Bug,
  FileText,
  Search,
  Bell,
  Menu,
  Activity,
  ShieldAlert,
  Server,
  ArrowUpRight,
  CircleCheck,
  Clock3,
  GraduationCap,
BookOpen,
Trophy,
Target,
Bot,
Award,
ChartNoAxesColumn,
ChevronDown,
LogOut,
} from "lucide-react";

import "./App.css";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

const osWarningGuides = {
  firewall: {
    title: "Firewall Protection",
    cause: "The Windows Firewall may be disabled for one or more network profiles.",
    why: "A firewall helps control incoming and outgoing network connections and reduces unwanted network access.",
    steps: [
      "Open Windows Security.",
      "Select Firewall & network protection.",
      "Check your active network profile.",
      "If the firewall is disabled, enable it if your device is not managed by an organisation.",
      "Return to CyberShield X and run the OS Security scan again."
    ]
  },

  antivirus: {
    title: "Antivirus Protection",
    cause: "Microsoft Defender or its real-time protection may be inactive.",
    why: "Antivirus protection helps detect and block malicious software.",
    steps: [
      "Open Windows Security.",
      "Select Virus & threat protection.",
      "Open Manage settings.",
      "Check whether Real-time protection is enabled.",
      "If you use another trusted antivirus, check its protection status instead.",
      "Run the OS Security scan again."
    ]
  },

  encryption: {
    title: "Drive Encryption",
    cause: "One or more detected drives may not have full encryption or active protection.",
    why: "Drive encryption helps protect files if a device or storage drive is lost or accessed without permission.",
    steps: [
      "Open Windows Settings.",
      "Go to Privacy & security.",
      "Look for Device encryption or BitLocker.",
      "Review the encryption status of your drives.",
      "Follow Windows instructions if you decide to enable encryption.",
      "Keep your recovery key somewhere secure.",
      "Run the OS Security scan again."
    ]
  }
};


// Sidebar navigation
const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Network Scanner", icon: Network },
  { name: "Asset Inventory", icon: Server },
  { name: "Web Security", icon: Globe },
  {
    name: "Social Engineering",
    icon: Users,
    children: [
      { name: "Academy Dashboard", icon: GraduationCap },
      { name: "Learning Levels", icon: BookOpen },
      { name: "Quiz Arena", icon: Trophy },
      { name: "Real-Life Challenges", icon: Target },
      { name: "AI Cyber Assistant", icon: Bot },
      { name: "Achievements", icon: Award },
      { name: "My Progress", icon: ChartNoAxesColumn },
    ],
  },
  { name: "OS Security", icon: Monitor },
  { name: "Vulnerability Management", icon: Bug },
 
];

// Sample dashboard findings
const findings = [
  {
    title: "Outdated software detected",
    asset: "Sample Web Server",
    severity: "High",
    status: "Open",
  },
  {
    title: "Missing security headers",
    asset: "Demo Website",
    severity: "Medium",
    status: "Under review",
  },
  {
    title: "Firewall configuration review",
    asset: "Test Workstation",
    severity: "Low",
    status: "Resolved",
  },
];

// Sample dashboard activities
const activities = [
  {
    title: "Dashboard initialized",
    time: "Just now",
    icon: CircleCheck,
  },
  {
    title: "Sample findings loaded",
    time: "A few minutes ago",
    icon: Activity,
  },
  {
    title: "Security assessment workspace created",
    time: "Today",
    icon: ShieldCheck,
  },
];


function App() {
  // General dashboard states

  const [activePage, setActivePage] = useState("Overview");
 
  const learnerAllowedPages = [
  "Network Scanner",
  "OS Security",
  "Academy Dashboard",
  "Learning Levels",
  "Quiz Arena",
  "Real-Life Challenges",
  "AI Cyber Assistant",
  "Achievements",
  "My Progress",
];
  const [currentView, setCurrentView] = useState("landing");
  const [supportForm, setSupportForm] = useState({ name: "", email: "", subject: "", category: "", message: "" });
  const [supportFeedback, setSupportFeedback] = useState({ type: "", message: "" });
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportPanelOpen, setSupportPanelOpen] = useState(false);
  const [supportSelectedMessage, setSupportSelectedMessage] = useState(null);
  const [supportAdminError, setSupportAdminError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(
    () => sessionStorage.getItem("cybershieldToken") || ""
  );

  const [authMode, setAuthMode] = useState("login");
  const [signupRole, setSignupRole] = useState("");
  const [adminInvitationCode, setAdminInvitationCode] = useState("");
  const [signupName, setSignupName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  useEffect(() => {
  if (
    currentUser?.role === "Learner" &&
    !learnerAllowedPages.includes(activePage)
  ) {
    setActivePage("Academy Dashboard");
  }
}, [currentUser, activePage]);

 const visibleNavigation =
  currentUser?.role === "Admin"
    ? navigation
    : navigation.filter(
        (item) =>
          item.name === "Social Engineering" ||
          learnerAllowedPages.includes(item.name)
      );

const authFetch = async (url, options = {}) => {
  const headers = {
    ...(options.headers || {}),
    ...(authToken
      ? { Authorization: `Bearer ${authToken}` }
      : {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
};

const loadAcademyProgress = async () => {
  const response = await authFetch("http://127.0.0.1:8002/api/academy/progress");
  if (response.ok) setBackendAcademyProgress(await response.json());
};
const loadDynamicQuestion = async (mode, newCycle = false) => {
  const response = await authFetch(`http://127.0.0.1:8002/api/academy/${mode}/next${newCycle ? "?new_cycle=true" : ""}`, { method: "POST" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Could not load a question");
  if (mode === "quiz") { setQuizQuestion(data); setQuizFeedback(null); }
  else { setChallengeQuestion(data); setChallengeFeedback(null); }
  return data;
};
const submitDynamicAnswer = async (mode, selectedOption) => {
  const question = mode === "quiz" ? quizQuestion : challengeQuestion;
  if (!question) return;
  const response = await authFetch(`http://127.0.0.1:8002/api/academy/${mode}/answer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attempt_token: question.attempt_token, selected_option: selectedOption }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Could not submit answer");
  mode === "quiz" ? setQuizFeedback({ ...data, selectedOption }) : setChallengeFeedback({ ...data, selectedOption });
  if (data.correct && data.xp_awarded) mode === "quiz" ? setQuizScore(score => score + 1) : setChallengeScore(score => score + 1);
  await loadAcademyProgress();
  return data;
};

const encryptLabText = async () => {
  setLabMessage({ type: "", text: "" }); setLabDecrypted("");
  if (!labPlaintext.trim()) { setLabMessage({ type: "error", text: "Enter text before encrypting." }); return; }
  setLabLoading(true);
  try {
    const response = await authFetch("http://127.0.0.1:8002/api/encryption-lab/encrypt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plaintext: labPlaintext }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Encryption failed.");
    setLabCiphertext(data.ciphertext); setLabKey(data.key); setLabNonce(data.nonce);
    setLabMessage({ type: "success", text: "Encrypted with AES-256-GCM. Keep the key and nonce to decrypt this result." });
  } catch (error) { setLabMessage({ type: "error", text: error.message || "Unable to reach the encryption service." }); }
  finally { setLabLoading(false); }
};

const decryptLabText = async () => {
  setLabMessage({ type: "", text: "" }); setLabDecrypted("");
  if (!labCiphertext.trim() || !labKey.trim() || !labNonce.trim()) { setLabMessage({ type: "error", text: "Ciphertext, key and nonce are all required." }); return; }
  setLabLoading(true);
  try {
    const response = await authFetch("http://127.0.0.1:8002/api/encryption-lab/decrypt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ciphertext: labCiphertext, key: labKey, nonce: labNonce }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Decryption failed.");
    setLabDecrypted(data.plaintext); setLabMessage({ type: "success", text: "Authentication passed. The original text was restored." });
  } catch (error) { setLabMessage({ type: "error", text: error.message || "Unable to reach the encryption service." }); }
  finally { setLabLoading(false); }
};

const loadSupportNotifications = async () => {
  if (currentUser?.role !== "Admin" || !authToken) return;
  try {
    const [countResponse, messagesResponse] = await Promise.all([
      authFetch("http://127.0.0.1:8002/api/support/admin/unread-count"),
      authFetch("http://127.0.0.1:8002/api/support/admin/messages"),
    ]);
    if (!countResponse.ok || !messagesResponse.ok) throw new Error("Unable to load support notifications");
    const countData = await countResponse.json();
    const messagesData = await messagesResponse.json();
    setSupportUnreadCount(countData.count);
    setSupportMessages(messagesData);
    setSupportAdminError("");
  } catch (error) { setSupportAdminError(error.message); }
};

useEffect(() => {
  if (currentUser?.role !== "Admin") {
    setSupportUnreadCount(0); setSupportMessages([]); setSupportPanelOpen(false); setSupportSelectedMessage(null);
    return;
  }
  loadSupportNotifications();
  const interval = window.setInterval(loadSupportNotifications, 30000);
  return () => window.clearInterval(interval);
}, [currentUser?.role, authToken]);

const openSupportMessage = async (id) => {
  try {
    const response = await authFetch(`http://127.0.0.1:8002/api/support/admin/messages/${id}`);
    if (!response.ok) throw new Error("Unable to open support message");
    setSupportSelectedMessage(await response.json());
    const selected = supportMessages.find(message => message.id === id);
    if (selected && !selected.is_read) {
      const readResponse = await authFetch(`http://127.0.0.1:8002/api/support/admin/messages/${id}/read`, { method: "PATCH" });
      if (!readResponse.ok) throw new Error("Unable to mark message as read");
      setSupportSelectedMessage(message => ({ ...message, is_read: true }));
      await loadSupportNotifications();
    }
  } catch (error) { setSupportAdminError(error.message); }
};
useEffect(() => {
  if (!authToken) return;

  const restoreSession = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8002/api/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Session expired");
      }

      const user = await response.json();

      setCurrentUser(user);
      setActivePage(
        user.role === "Admin" ? "Overview" : "Academy Dashboard"
      );
      setCurrentView("dashboard");
    } catch {
      sessionStorage.removeItem("cybershieldToken");
      setAuthToken("");
      setCurrentUser(null);
      setCurrentView("landing");
      setAuthError("");
      setAuthMode("login");
      setLoginPassword("");
    }
  };

  restoreSession();
}, [authToken]);

  const [socialMenuOpen, setSocialMenuOpen] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
const [quizScore, setQuizScore] = useState(0);
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [quizQuestionCount, setQuizQuestionCount] = useState(0);
  const [backendAcademyProgress, setBackendAcademyProgress] = useState(null);
const [vulnerabilities, setVulnerabilities] = useState([]);
const [vulnerabilityLoading, setVulnerabilityLoading] = useState(false);
const [vulnerabilityError, setVulnerabilityError] = useState("");
// AI Cyber Assistant states
const [chatMessages, setChatMessages] = useState([
  {
    role: "assistant",
    content: "Hello! I'm CyberShield AI. Ask me anything about ethical hacking, cybersecurity, networking, or secure coding."
  }
]);

const [chatInput, setChatInput] = useState("");
const [chatLoading, setChatLoading] = useState(false);
const [chatError, setChatError] = useState("");
const chatEndRef = useRef(null);

useEffect(() => {
  chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [chatMessages, chatLoading]);
const loadVulnerabilities = async () => {
  setVulnerabilityLoading(true);
  setVulnerabilityError("");

  try {
    const response = await authFetch(
      "http://127.0.0.1:8002/api/vulnerabilities/"
    );

    if (!response.ok) {
      throw new Error("Failed to load vulnerabilities");
    }

    const data = await response.json();
    setVulnerabilities(data);
  } catch (error) {
    setVulnerabilityError(
      "Unable to load vulnerability data. Check your backend."
    );
  } finally {
    setVulnerabilityLoading(false);
  }
};
useEffect(() => {
  if (
    currentView === "dashboard" &&
    currentUser?.role === "Admin" &&
    activePage === "Vulnerability Management"
  ) {
    loadVulnerabilities();
  }
}, [activePage, currentView, currentUser]);
const [selectedAnswer, setSelectedAnswer] = useState(null);
const [quizFinished, setQuizFinished] = useState(false);
const [challengeIndex, setChallengeIndex] = useState(0);
const [challengeAnswer, setChallengeAnswer] = useState(null);
const [challengeScore, setChallengeScore] = useState(0);
const [challengeQuestion, setChallengeQuestion] = useState(null);
const [challengeFeedback, setChallengeFeedback] = useState(null);
const [challengeQuestionCount, setChallengeQuestionCount] = useState(0);
const [challengeFinished, setChallengeFinished] = useState(false);

useEffect(() => {
  if (!authToken || currentUser?.role !== "Learner") return;
  loadAcademyProgress().catch(() => {});
}, [authToken, currentUser?.role]);
useEffect(() => {
  if (currentView !== "dashboard" || activePage !== "Quiz Arena" || !authToken || currentUser?.role !== "Learner" || quizQuestion || quizFinished || quizFeedback?.exhausted) return;
  loadDynamicQuestion("quiz").then(data => { if (!data.exhausted) setQuizQuestionCount(count => count + 1); }).catch(error => setQuizFeedback({ error: error.message }));
}, [activePage, currentView, authToken, currentUser?.role, quizQuestion, quizFinished, quizFeedback?.exhausted]);
useEffect(() => {
  if (currentView !== "dashboard" || activePage !== "Real-Life Challenges" || !authToken || currentUser?.role !== "Learner" || challengeQuestion || challengeFinished || challengeFeedback?.exhausted) return;
  loadDynamicQuestion("challenge").then(data => { if (!data.exhausted) setChallengeQuestionCount(count => count + 1); }).catch(error => setChallengeFeedback({ error: error.message }));
}, [activePage, currentView, authToken, currentUser?.role, challengeQuestion, challengeFinished, challengeFeedback?.exhausted]);
const [achievementNotice, setAchievementNotice] = useState("");
const [savedProgress, setSavedProgress] = useState(() => {
  try {
    const saved = localStorage.getItem("cybershieldProgress");
    return saved
      ? JSON.parse(saved)
      : {
          quizXP: 0,
          challengeXP: 0,
          quizzesCompleted: 0,
          challengesCompleted: 0,
        };
  } catch {
    return {
      quizXP: 0,
      challengeXP: 0,
      quizzesCompleted: 0,
      challengesCompleted: 0,
      perfectQuizCompleted: false,
    };
  }
});

useEffect(() => {
  localStorage.setItem(
    "cybershieldProgress",
    JSON.stringify(savedProgress)
  );
}, [savedProgress]);
  const [search, setSearch] = useState("");
  // Keep the application navigation visible on desktop while starting it closed
  // on small touch screens. The menu button remains the single way to reveal it.
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth > 760
  );
  const navigateFromSidebar = (page) => {
    setActivePage(page);
    if (window.innerWidth <= 760) setSidebarOpen(false);
  };
  
  // Overview dashboard data
const [dashboardAssets, setDashboardAssets] = useState([]);
const [securityScore, setSecurityScore] = useState(null);
const [dashboardVulnerabilities, setDashboardVulnerabilities] = useState([]);
const [dashboardLoading, setDashboardLoading] = useState(false);
const [dashboardError, setDashboardError] = useState("");

  // Network Scanner states
  const [scannerData, setScannerData] = useState(null);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [scannerError, setScannerError] = useState("");
  // Web Security states
const [webSecurityUrl, setWebSecurityUrl] = useState("");
const [webSecurityResult, setWebSecurityResult] = useState(null);
const [webSecurityLoading, setWebSecurityLoading] = useState(false);
const [webSecurityError, setWebSecurityError] = useState("");
const [levelUpNotice, setLevelUpNotice] = useState("");
const [selectedOSWarning, setSelectedOSWarning] = useState(null);
// Automatic OS Scanner
const [scanResults, setScanResults] = useState(null);
const [scanning, setScanning] = useState(false);
const [scanError, setScanError] = useState("");
const [labPlaintext, setLabPlaintext] = useState("");
const [labCiphertext, setLabCiphertext] = useState("");
const [labKey, setLabKey] = useState("");
const [labNonce, setLabNonce] = useState("");
const [labDecrypted, setLabDecrypted] = useState("");
const [labMessage, setLabMessage] = useState({ type: "", text: "" });
const [labLoading, setLabLoading] = useState(false);

const runOSScan = async () => {
  setScanning(true);
  setScanError("");
  setScanResults(null);
  setSelectedOSWarning(null);

  try {
    const response = await authFetch(
      "http://127.0.0.1:8002/api/os-security/scan"
    );

    if (!response.ok) {
      throw new Error("Scanner request failed");
    }

    const data = await response.json();
setScanResults(data);

// Refresh dashboard after the scan
if (currentUser?.role === "Admin") {
  await loadDashboardData();
}
  } catch (error) {
    setScanError(
      "Unable to connect to the scanner. Check that your backend is running."
    );
  } finally {
    setScanning(false);
  }
};

  // Asset Inventory states
  const [assets, setAssets] = useState([]);
  const [assetLoading, setAssetLoading] = useState(false);
  const [assetError, setAssetError] = useState("");
  const [discoveredDevice, setDiscoveredDevice] = useState(null);
const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState(null);
const [apiStatus, setApiStatus] = useState("Checking...");
  const [assetForm, setAssetForm] = useState({
    device_name: "",
    ip_address: "",
    device_type: "Laptop",
    description: "",
  });

  const isOverview = activePage === "Overview";
  const isAcademyPage = activePage === "Academy Dashboard";
  const learningTopics = [
  "Cybersecurity Fundamentals",
  "Passwords & Authentication",
  "Phishing Awareness",
  "Social Engineering",
  "Malware Awareness",
  "Network Security",
  "Web Security",
  "Ethical Hacking",
  "Incident Response",
  "Cybersecurity Master Challenge",
];
const quizQuestions = [
  {
    question: "What is phishing?",
    options: [
      "A type of computer hardware",
      "A fraudulent attempt to steal sensitive information",
      "A method of updating software",
      "A network connection"
    ],
    answer: 1,
    explanation:
      "Phishing is a social engineering technique where attackers pretend to be trustworthy sources to trick people into revealing information."
  },
  {
    question: "Which is the strongest password practice?",
    options: [
      "Using your birthday",
      "Using the same password everywhere",
      "Using a long, unique password",
      "Sharing your password with friends"
    ],
    answer: 2,
    explanation:
      "Long, unique passwords make accounts harder to compromise. A password manager can help you manage them."
  },
  {
    question: "What should you do with a suspicious email link?",
    options: [
      "Click it immediately",
      "Forward it to everyone",
      "Verify the sender and report it",
      "Reply with your password"
    ],
    answer: 2,
    explanation:
      "Verify suspicious messages through a trusted channel and report them. Avoid opening unexpected links."
  },
  {
    question: "What does MFA stand for?",
    options: [
      "Multiple File Access",
      "Multi-Factor Authentication",
      "Main Firewall Application",
      "Managed File Account"
    ],
    answer: 1,
    explanation:
      "Multi-Factor Authentication uses two or more different verification factors to protect an account."
  },
  {
    question: "What is social engineering?",
    options: [
      "Building computer networks",
      "Manipulating people into revealing information or taking unsafe actions",
      "Writing programming languages",
      "Installing operating systems"
    ],
    answer: 1,
    explanation:
      "Social engineering exploits human trust and behaviour. Awareness and verification help prevent it."
  }
];
const challenges = [
  {
    title: "The Suspicious Email",
    scenario:
      "You receive an email claiming your college account will be suspended unless you verify your details immediately.",
    question: "What should you do?",
    options: [
      "Click the link immediately",
      "Reply with your password",
      "Verify through the official college portal",
      "Forward it to classmates"
    ],
    answer: 2,
    explanation:
      "Urgent messages requesting account verification may be phishing attempts. Always use the official portal."
  },
  {
    title: "The Unknown USB",
    scenario:
      "You find an unknown USB drive near your college computer lab.",
    question: "What is the safest action?",
    options: [
      "Plug it into your laptop",
      "Give it to the responsible IT staff",
      "Copy its files",
      "Try it on a friend's computer"
    ],
    answer: 1,
    explanation:
      "Unknown USB devices may contain harmful software. Do not connect them to your devices."
  },
  {
    title: "The Fake Login Page",
    scenario:
      "A message directs you to a login page that looks different from your usual college portal.",
    question: "What should you do?",
    options: [
      "Enter your login details",
      "Check the official website independently",
      "Share the page with friends",
      "Reuse another account password"
    ],
    answer: 1,
    explanation:
      "Independently visit the official website rather than trusting unexpected login links."
  },
  {
    title: "The Impersonation Call",
    scenario:
      "Someone calls claiming to be technical support and asks for your one-time password.",
    question: "What should you do?",
    options: [
      "Share the OTP",
      "Ask them to wait",
      "Refuse and contact official support",
      "Send a screenshot"
    ],
    answer: 2,
    explanation:
      "Never share an OTP. Contact the organisation using its official support channel."
  }
];
const totalXP = savedProgress.quizXP + savedProgress.challengeXP;

const currentLevel = Math.floor(totalXP / 100) + 1;
const xpIntoLevel = totalXP % 100;
const levelProgress = xpIntoLevel;
const xpNeeded = 100 - xpIntoLevel;

const levelName =
  currentLevel === 1 ? "Cyber Beginner" :
  currentLevel === 2 ? "Cyber Explorer" :
  currentLevel === 3 ? "Cyber Defender" :
  "Cybersecurity Expert";
  const previousLevel = useRef(currentLevel);
useEffect(() => {
  if (currentLevel > previousLevel.current) {
    setLevelUpNotice(`🎉 Level Up! You reached ${levelName}!`);

    const timer = setTimeout(() => {
      setLevelUpNotice("");
    }, 3500);

    previousLevel.current = currentLevel;

    return () => clearTimeout(timer);
  }
}, [currentLevel, levelName]);
const quizzesCompleted = savedProgress.quizzesCompleted;

const challengesCompleted = savedProgress.challengesCompleted;
const academyProgress = Math.min(
  100,
  Math.round(
    ((quizzesCompleted + challengesCompleted) /
      (1 + challenges.length)) * 100
  )
);
const achievements = [
  {
    title: "First Quiz Completed",
    description: "Complete your first cybersecurity quiz.",
    icon: Trophy,
    unlocked: savedProgress.quizzesCompleted >= 1,
  },
  {
    title: "Perfect Quiz Score",
    description: "Answer every question correctly in a quiz.",
    icon: Award,
    unlocked: savedProgress.perfectQuizCompleted,
  },
  {
    title: "First Challenge Completed",
    description: "Complete your first real-life challenge.",
    icon: Target,
    unlocked: savedProgress.challengesCompleted >= 1,
  },
  {
    title: "Cybersecurity Explorer",
    description: "Complete a quiz and a real-life challenge.",
    icon: GraduationCap,
    unlocked:
      savedProgress.quizzesCompleted >= 1 &&
      savedProgress.challengesCompleted >= 1,
  },
  {
    title: "Academy Master",
    description: "Complete all academy activities.",
    icon: ShieldCheck,
    unlocked:
      savedProgress.quizzesCompleted >= 1 &&
      savedProgress.challengesCompleted >= challenges.length,
  },
];
const previousUnlockedAchievements = useRef(
  achievements
    .filter((item) => item.unlocked)
    .map((item) => item.title)
);

useEffect(() => {
  const unlockedNow = achievements
    .filter((item) => item.unlocked)
    .map((item) => item.title);

  const newlyUnlocked = unlockedNow.filter(
    (title) => !previousUnlockedAchievements.current.includes(title)
  );

  previousUnlockedAchievements.current = unlockedNow;

  if (newlyUnlocked.length > 0) {
    setAchievementNotice(
      `🏆 Achievement Unlocked: ${newlyUnlocked.join(", ")}`
    );

    const timer = setTimeout(() => {
      setAchievementNotice("");
    }, 3500);

    return () => clearTimeout(timer);
  }
}, [achievements]);

  // Network Scanner API function
  const scanNetwork = async () => {
    setScannerLoading(true);
    setScannerError("");

    try {
      const response = await authFetch(
        "http://127.0.0.1:8002/api/scanner/hostname"
      );

      if (!response.ok) {
        throw new Error("Unable to retrieve system information");
      }

      const data = await response.json();
      setScannerData(data);
    } catch (error) {
      setScannerError(error.message);
    } finally {
      setScannerLoading(false);
    }
  };
  const scanWebsite = async (e) => {
  e.preventDefault();

  setWebSecurityLoading(true);
  setWebSecurityError("");
  setWebSecurityResult(null);

  try {
    const response = await authFetch(
      `http://127.0.0.1:8002/api/web-security/check?url=${encodeURIComponent(webSecurityUrl.trim())}`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Unable to scan website.");
    }

    setWebSecurityResult(data);
    await loadDashboardData();
  } catch (error) {
    setWebSecurityError(error.message || "Unable to connect to backend.");
  } finally {
    setWebSecurityLoading(false);
  }
};

  // Fetch registered assets
  const fetchAssets = async () => {
    setAssetLoading(true);
    setAssetError("");

    try {
      const response = await authFetch(
        "http://127.0.0.1:8002/api/assets/"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch assets");
      }

      const data = await response.json();
      setAssets(data);
    } catch (error) {
      setAssetError(
        "Unable to load assets. Check your backend server."
      );
    } finally {
      setAssetLoading(false);
    }
  };
  
const loadDashboardData = async () => {
  setDashboardLoading(true);
  setDashboardError("");

  try {
    const [
      assetResponse,
      vulnerabilityResponse,
      securityScoreResponse
    ] = await Promise.all([
      authFetch("http://127.0.0.1:8002/api/assets/"),
      authFetch("http://127.0.0.1:8002/api/vulnerabilities/"),
      authFetch("http://127.0.0.1:8002/api/dashboard/security-score")
    ]);

    if (
      !assetResponse.ok ||
      !vulnerabilityResponse.ok ||
      !securityScoreResponse.ok
    ) {
      throw new Error("Unable to load dashboard data.");
    }

    const [assetData, vulnerabilityData, scoreData] =
      await Promise.all([
        assetResponse.json(),
        vulnerabilityResponse.json(),
        securityScoreResponse.json()
      ]);

    setDashboardAssets(
      Array.isArray(assetData) ? assetData : []
    );

    setDashboardVulnerabilities(
      Array.isArray(vulnerabilityData)
        ? vulnerabilityData
        : []
    );

    setSecurityScore(scoreData);
    console.log("Dashboard Security Score updated:", scoreData.score);

  } catch (error) {
    console.error("Dashboard loading error:", error);

    setDashboardError(
      "Unable to load live dashboard data. Check the backend."
    );
  } finally {
    setDashboardLoading(false);
  }
};


  useEffect(() => {
  if (
    currentView === "dashboard" &&
    currentUser?.role === "Admin" &&
    activePage === "Overview"
  ) {
    loadDashboardData();
  }
}, [activePage, currentView, currentUser]);

  // Register a new asset
  const addAsset = async (e) => {
  e.preventDefault();
  setAssetError("");

  const isEditing = editingAssetId !== null;

  try {
    const response = await authFetch(
      isEditing
        ? `http://127.0.0.1:8002/api/assets/${editingAssetId}`
        : "http://127.0.0.1:8002/api/assets/",
      {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assetForm),
      }
    );

    if (!response.ok) {
      throw new Error("Unable to save asset");
    }

    await response.json();

    setAssetForm({
      device_name: "",
      ip_address: "",
      device_type: "Laptop",
      description: "",
    });

    setEditingAssetId(null);
    setShowAssetForm(false);

    await fetchAssets();

  } catch (error) {
    setAssetError("Unable to save device. Please check your details.");
  }
};
// Start editing an asset
const startEditAsset = (asset) => {
  setEditingAssetId(asset.id);

  setAssetForm({
    device_name: asset.device_name,
    ip_address: asset.ip_address,
    device_type: asset.device_type,
    description: asset.description || "",
  });

  setShowAssetForm(true);
};

// Delete an asset
const deleteAsset = async (assetId) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this device?"
  );

  if (!confirmed) return;

  try {
    const response = await authFetch(
      `http://127.0.0.1:8002/api/assets/${assetId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Unable to delete asset");
    }

    await fetchAssets();

  } catch (error) {
    setAssetError("Unable to delete device.");
  }
};

  // Check backend health
  useEffect(() => {
    fetch("http://127.0.0.1:8002/api/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend unavailable");
        }

        return response.json();
      })
      .then((data) => {
        setApiStatus(data.status);
      })
      .catch(() => {
        setApiStatus("Offline");
      });
  }, []);

  // Automatically load assets when Asset Inventory opens
useEffect(() => {
  if (
    currentView === "dashboard" &&
    currentUser?.role === "Admin" &&
    activePage === "Asset Inventory"
  ) {
    fetchAssets();
  }
}, [activePage, currentView, currentUser]);
const discoverDevice = async () => {
  setDiscoveryLoading(true);
  setAssetError("");
  setDiscoveredDevice(null);

  try {
    const response = await authFetch(
      "http://127.0.0.1:8002/api/assets/discover"
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Device discovery failed.");
    }

    setDiscoveredDevice(data);
  } catch (error) {
    setAssetError(error.message || "Unable to discover device.");
  } finally {
    setDiscoveryLoading(false);
  }
};
const registerDiscoveredDevice = async () => {
  if (!discoveredDevice) return;

  if (
    assets.some(
      (asset) =>
        asset.ip_address === discoveredDevice.ip_address
    )
  ) {
    setAssetError("This device is already registered.");
    return;
  }

  setAssetError("");

  try {
    const response = await authFetch(
      "http://127.0.0.1:8002/api/assets/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_name: discoveredDevice.device_name,
          ip_address: discoveredDevice.ip_address,
          device_type: "Laptop",
          description: `Automatically discovered computer. OS: ${discoveredDevice.device_type}`,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Unable to register device."
      );
    }

    setDiscoveredDevice(null);
    await fetchAssets();

  } catch (error) {
    setAssetError(
      error.message || "Unable to register device."
    );
  }
};
const sendChatMessage = async (e) => {
  e.preventDefault();

  const message = chatInput.trim();
  if (!message || chatLoading) return;

  setChatMessages((previous) => [
    ...previous,
    { role: "user", content: message }
  ]);

  setChatInput("");
  setChatLoading(true);
  setChatError("");

  try {
    const response = await authFetch(
      "http://127.0.0.1:8002/api/ai-assistant/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Unable to get AI response.");
    }

    setChatMessages((previous) => [
      ...previous,
      { role: "assistant", content: data.reply || "No response received." }
    ]);
  } catch (error) {
    setChatError(error.message || "Unable to connect to CyberShield AI.");
  } finally {
    setChatLoading(false);
  }
};
const handleRegister = async (e) => {
  e.preventDefault();
  setAuthError("");
  setAuthLoading(true);

  try {
    const registrationPath = signupRole === "Admin"
      ? "/api/auth/register-admin"
      : "/api/auth/register";
    const response = await fetch(`http://127.0.0.1:8002${registrationPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: signupName,
        email: loginEmail,
        password: loginPassword,
        ...(signupRole === "Admin" ? { invitation_code: adminInvitationCode } : {}),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Registration failed");
    }

    setAuthMode("login");
    setSignupRole("");
    setLoginPassword("");
    setAdminInvitationCode("");
    setAuthError("Account created! Please log in.");
  } catch (error) {
    setAuthError(error.message);
  } finally {
    setAuthLoading(false);
  }
};

const handleLogin = async (e) => {
  e.preventDefault();
  setAuthError("");
  setAuthLoading(true);

  try {
    const response = await fetch("http://127.0.0.1:8002/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: loginEmail,
        password: loginPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Login failed");
    }

    sessionStorage.setItem("cybershieldToken", data.access_token);
    setAuthToken(data.access_token);
    setCurrentUser(data.user);

    setActivePage(
      data.user.role === "Admin" ? "Overview" : "Academy Dashboard"
    );

    setCurrentView("dashboard");
  } catch (error) {
    setAuthError(error.message);
  } finally {
    setAuthLoading(false);
  }
};

const handleLogout = () => {
  sessionStorage.removeItem("cybershieldToken");
  setAuthToken("");
  setCurrentUser(null);
  setLoginPassword("");
  setCurrentView("landing");
  setActivePage("Overview");
};

const handleSupportSubmit = async (event) => {
  event.preventDefault();
  setSupportFeedback({ type: "", message: "" });
  setSupportLoading(true);
  try {
    const response = await fetch("http://127.0.0.1:8002/api/support/requests", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(supportForm),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Unable to submit support request");
    setSupportFeedback({ type: "success", message: "Your support request was saved successfully." });
    setSupportForm({ name: "", email: "", subject: "", category: "", message: "" });
  } catch (error) {
    setSupportFeedback({ type: "error", message: error.message || "Could not reach support. Please try again." });
  } finally { setSupportLoading(false); }
};

if (currentView === "support") {
  return (
    <main className="support-page">
      <section className="support-card" aria-labelledby="support-title">
        <button className="support-back" type="button" onClick={() => { setCurrentView("landing"); setSupportFeedback({ type: "", message: "" }); }}>← Back to Home</button>
        <div className="support-heading">
          <span className="support-mark"><ShieldCheck size={20} /></span>
          <p className="support-eyebrow">CYBERSHIELD X</p>
          <h1 id="support-title">Contact support</h1>
          <p>Share the details of your question or issue</p>
        </div>
        <form className="support-form" onSubmit={handleSupportSubmit}>
          <label>Full Name<input required minLength={2} maxLength={100} autoComplete="name" value={supportForm.name} onChange={e => setSupportForm({...supportForm,name:e.target.value})} placeholder="Your name" /></label>
          <label>Email Address<input required type="email" maxLength={255} autoComplete="email" value={supportForm.email} onChange={e => setSupportForm({...supportForm,email:e.target.value})} placeholder="you@example.com" /></label>
          <label>Subject<input required minLength={3} maxLength={160} value={supportForm.subject} onChange={e => setSupportForm({...supportForm,subject:e.target.value})} placeholder="How can we help?" /></label>
          <label>Support category<select required value={supportForm.category} onChange={e => setSupportForm({...supportForm,category:e.target.value})}><option value="" disabled>Select a category</option><option>Technical Issue</option><option>Account Problem</option><option>Bug Report</option><option>General Question</option><option>Other</option></select></label>
          <label className="support-message-field">Message<textarea required minLength={10} maxLength={5000} rows={5} value={supportForm.message} onChange={e => setSupportForm({...supportForm,message:e.target.value})} placeholder="Describe your question or issue" /></label>
          {supportFeedback.message && <p className={`support-feedback ${supportFeedback.type}`} role="status">{supportFeedback.message}</p>}
          <button className="support-submit" type="submit" disabled={supportLoading}>{supportLoading ? "Submitting…" : "Submit request"}</button>
        </form>
      </section>
    </main>
  );
}

if (currentView === "landing") {
  return (
    <div className="landing-page csx-landing">
      <nav className="landing-nav csx-nav">
        <a className="landing-brand csx-brand" href="#platform" aria-label="CyberShield X home">
          <ShieldCheck size={26} /><span>CyberShield <strong>X</strong></span>
        </a>
        <div className="landing-links csx-links">
          <a href="#platform">Home</a><a href="#features">Features</a><a href="#learning">Learning</a><a href="#about">About</a>
        </div>
        <div className="csx-nav-actions">
          <button className="csx-login-link" onClick={() => { setAuthMode("login"); setCurrentView("login"); }}>Log In</button>
          <button className="csx-signup-button" onClick={() => { setAuthMode("signup"); setSignupRole(""); setCurrentView("login"); }}>Sign Up</button>
        </div>
      </nav>
      <main className="landing-hero" id="platform">
        <div className="landing-copy">
          <span className="landing-kicker"><i /> Security operations and awareness</span>
          <h1>Build stronger security habits. <em>See risk sooner.</em></h1>
          <p>CyberShield X brings practical security assessments and hands-on social engineering education into one focused workspace.</p>
          <div className="landing-actions">
            <button className="landing-primary" onClick={() => { setAuthMode("signup"); setSignupRole(""); setCurrentView("login"); }}>Get Started <span>?</span></button>
            <a className="landing-secondary" href="#features">Explore Features <span>?</span></a>
          </div>
          <div className="landing-proof"><span><ShieldCheck size={16} /> Practical security checks</span><span><BookOpen size={16} /> Guided learner pathways</span></div>
        </div>
        <div className="landing-product-visual" aria-label="Illustration of the CyberShield security workspace">
          <div className="visual-window-bar"><span /><span /><span /><b>Security workspace</b><small>WORKSPACE</small></div>
          <div className="visual-content"><aside className="visual-rail"><ShieldCheck size={19} /><i /><i /><i /><i /></aside>
            <div className="visual-main"><div className="visual-title"><div><small>WORKSPACE OVERVIEW</small><strong>Security posture</strong></div><span><i /> Protected</span></div>
              <div className="visual-score-row"><div className="visual-score"><div className="score-ring"><strong>84</strong><small>/100</small></div><span>Assessment score</span></div><div className="visual-signal"><small>ASSESSMENT ACTIVITY</small><div className="signal-chart">{[32,52,42,68,46,74,57,82,58,69,48,76].map((height,index)=><b key={index} style={{height:`${height}%`}} />)}</div><div className="signal-labels"><span>MON</span><span>WED</span><span>FRI</span><span>SUN</span></div></div></div>
              <div className="visual-bottom"><div><span className="signal-dot cyan" /><span>OS security</span><b>Assessment</b></div><div><span className="signal-dot green" /><span>Learning path</span><b>In progress</b></div></div>
            </div>
          </div>
        </div>
      </main>
      <section className="landing-features" id="features">
        <div className="landing-section-heading"><div><span className="landing-kicker">THE CYBERSHIELD X PLATFORM</span><h2>Security tools and skills, in one place</h2></div><p>Assess your environment and build the judgment to respond to everyday security risks.</p></div>
        <div className="landing-feature-grid">
          <article className="landing-feature-card"><span className="feature-icon"><Monitor size={19} /></span><h3>OS Security Assessment</h3><p>Review key device protections with an operating system security scan.</p></article>
          <article className="landing-feature-card" id="learning"><span className="feature-icon"><Trophy size={19} /></span><h3>Social Engineering Quizzes</h3><p>Practice recognizing manipulation with questions matched to your learning level.</p></article>
          <article className="landing-feature-card"><span className="feature-icon"><Target size={19} /></span><h3>Real-Life Security Challenges</h3><p>Work through realistic scenarios and choose safer responses.</p></article>
          <article className="landing-feature-card"><span className="feature-icon"><BookOpen size={19} /></span><h3>Learning Academy</h3><p>Build cybersecurity knowledge through structured levels and progress tracking.</p></article>
          <article className="landing-feature-card"><span className="feature-icon"><ShieldCheck size={19} /></span><h3>Security Assessment Dashboard</h3><p>Review assessment results, assets, and findings in a role-based workspace.</p></article>
        </div>
      </section>
      <footer className="landing-footer csx-footer" id="about"><span>? 2026 CyberShield X</span><span>Practical security for people and systems</span><a href="#support" onClick={event => { event.preventDefault(); setCurrentView("support"); setSupportFeedback({ type: "", message: "" }); }}>Support</a></footer>
    </div>
  );
}

if (currentView === "login") {
  return (
    <div className="login-page">
      <div className="login-card">
        <button
          className="back-button"
          onClick={() => {
            setCurrentView("landing");
            setAuthError("");
          }}
        >
          ← Back
        </button>

        <div className="login-brand">
          <ShieldCheck size={36} />
          <h1>CyberShield X</h1>
        </div>

        <h2>
          {authMode === "login"
            ? "Welcome Back"
            : signupRole === "Admin" ? "Create an Admin Account" : "Create a Learner Account"}
        </h2>

        <p className="auth-intro">
          {authMode === "login"
            ? "Sign in to access your security dashboard."
            : signupRole === "Admin"
              ? "Register with an authorized Admin invitation code."
              : "Start learning with guided cybersecurity training and challenges."}
        </p>

        {authMode === "signup" && !signupRole && (
          <div className="account-type-picker" role="group" aria-label="Choose account type">
            {[{ role: "Learner", title: "Learner Account", detail: "Academy, challenges and learning labs" }, { role: "Admin", title: "Admin Account", detail: "For authorized administrators with an invitation" }].map(({ role, title, detail }) => (
              <button key={role} type="button" className="account-type-option" onClick={() => { setSignupRole(role); setAuthError(""); }}>
                <strong>{title}</strong><span>{detail}</span>
              </button>
            ))}
          </div>
        )}

        {authMode === "signup" && signupRole && (
          <button type="button" className="signup-back" onClick={() => { setSignupRole(""); setAdminInvitationCode(""); setAuthError(""); }}>
            ← Choose a different account type
          </button>
        )}

        {(authMode === "login" || signupRole) && <form
          onSubmit={authMode === "login" ? handleLogin : handleRegister}
        >
          {authMode === "signup" && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="Enter your name"
                required
                minLength={2}
              />
            </div>
          )}

          {authMode === "signup" && signupRole === "Admin" && (
            <div className="form-group">
              <label htmlFor="admin-invitation-code">Admin invitation code</label>
              <input id="admin-invitation-code" type="password" autoComplete="off" value={adminInvitationCode} onChange={(e) => setAdminInvitationCode(e.target.value)} placeholder="Enter your invitation code" required />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={10}
            />
          </div>

          {authError && (
            <p className="auth-error">{authError}</p>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={authLoading}
          >
            {authLoading
              ? "Please wait..."
              : authMode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>}

        <div className="auth-switch">
          {authMode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}

          <button
            type="button"
            onClick={() => {
              const nextMode = authMode === "login" ? "signup" : "login";
              setAuthMode(nextMode);
              setSignupRole(nextMode === "signup" ? "" : "");
              setAuthError("");
              setLoginPassword("");
            }}
          >
            {authMode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}


  return (
    <div className="app">

      {sidebarOpen && (
        <button
          className="mobile-nav-scrim"
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${
          sidebarOpen ? "" : "sidebar-hidden"
        }`}
      >
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={27} />
          </div>

          <div>
            <h2>CyberShield X</h2>
            <span>SECURITY PLATFORM</span>
          </div>
        </div>

        <div className="nav-label">MAIN MENU</div>

  <nav className="navigation">
 {visibleNavigation.map((item) => {
    const Icon = item.icon;

    if (item.children) {
      return (
        <div key={item.name}>
          <button
            className={`nav-item ${
              activePage === item.name ||
              item.children.some((child) => child.name === activePage)
                ? "active"
                : ""
            }`}
            onClick={() => setSocialMenuOpen(!socialMenuOpen)}
          >
            <Icon size={19} />
            <span>{item.name}</span>
            <ChevronDown
              size={16}
              style={{
                marginLeft: "auto",
                transform: socialMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {socialMenuOpen && (
            <div className="sub-navigation">
              {item.children.map((child) => {
                const ChildIcon = child.icon;

                return (
                  <button
                    key={child.name}
                    className={`nav-item sub-nav-item ${
                      activePage === child.name ? "active" : ""
                    }`}
                    onClick={() => navigateFromSidebar(child.name)}
                  >
                    <ChildIcon size={17} />
                    <span>{child.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.name}
        className={`nav-item ${
          activePage === item.name ? "active" : ""
        }`}
        onClick={() => navigateFromSidebar(item.name)}
      >
        <Icon size={19} />
        <span>{item.name}</span>
      </button>
    );
  })}
</nav>

        <div className="sidebar-bottom">
<button className="logout-button" onClick={handleLogout}>
  <LogOut size={18} />
  <span>Logout</span>
</button>
          <div className="user-card">
            <div className="avatar"> {currentUser?.name?.charAt(0).toUpperCase() || "U"}</div>

            <div>
              <strong>{currentUser?.name || "User"}</strong>
              <span>{currentUser?.role || "User"}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main">

        {/* Topbar */}
        <header className="topbar">
          <button
            className="icon-button menu-button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <Menu size={21} />
          </button>

          <div className="breadcrumb">
            CyberShield X <span>/</span> {activePage}
          </div>

          <div className="top-actions">
            <div className="search-box">
              <Search size={17} />

              <input
                type="text"
                placeholder="Search dashboard..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {currentUser?.role === "Admin" && (
              <div className="support-notification-wrap">
                <button className="icon-button support-bell-button" aria-label={`Support notifications, ${supportUnreadCount} unread`} aria-expanded={supportPanelOpen} onClick={() => { const next = !supportPanelOpen; setSupportPanelOpen(next); if (next) loadSupportNotifications(); }}>
                  <Bell size={20} />{supportUnreadCount > 0 && <span className="support-unread-badge">{supportUnreadCount > 99 ? "99+" : supportUnreadCount}</span>}
                </button>
                {supportPanelOpen && <section className="support-notification-panel" aria-label="Support messages">
                  <header><div><strong>Support messages</strong><span>{supportUnreadCount} unread</span></div><button type="button" onClick={() => loadSupportNotifications()}>Refresh</button></header>
                  {supportAdminError && <p className="support-admin-error">{supportAdminError}</p>}
                  {supportMessages.length === 0 && !supportAdminError ? <p className="support-empty">No support messages yet</p> : <div className="support-notification-list">{supportMessages.slice(0, 8).map(message => <button type="button" key={message.id} className={`support-notification ${message.is_read ? "read" : "unread"}`} onClick={() => openSupportMessage(message.id)}><span className="support-message-state" /><span className="support-notification-copy"><strong>{message.subject}</strong><span>{message.name} · {message.category}</span><time>{message.created_at ? new Date(message.created_at).toLocaleString() : ""}</time></span></button>)}</div>}
                </section>}
              </div>
            )}

            <div className="top-avatar">
              {currentUser?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </header>
        {supportSelectedMessage && currentUser?.role === "Admin" && <div className="support-detail-backdrop" onClick={() => setSupportSelectedMessage(null)} role="presentation"><section className="support-detail-card" role="dialog" aria-modal="true" aria-labelledby="support-detail-title" onClick={event => event.stopPropagation()}><button className="support-detail-close" onClick={() => setSupportSelectedMessage(null)} aria-label="Close message">×</button><p className="support-detail-kicker">{supportSelectedMessage.category} · {supportSelectedMessage.is_read ? "Read" : "Unread"}</p><h2 id="support-detail-title">{supportSelectedMessage.subject}</h2><dl><div><dt>From</dt><dd>{supportSelectedMessage.name}</dd></div><div><dt>Email</dt><dd>{supportSelectedMessage.email}</dd></div><div><dt>Submitted</dt><dd>{supportSelectedMessage.created_at ? new Date(supportSelectedMessage.created_at).toLocaleString() : "—"}</dd></div><div><dt>Status</dt><dd>{supportSelectedMessage.is_read ? "Read" : "Unread"}</dd></div></dl><p className="support-detail-message">{supportSelectedMessage.message}</p></section></div>}
{achievementNotice && (
  <div className="achievement-toast">
    <Trophy size={22} />
    <strong>{achievementNotice}</strong>
  </div>
)}
{levelUpNotice && (
  <div className="achievement-toast level-up-toast">
    <Trophy size={24} />
    <strong>{levelUpNotice}</strong>
  </div>
)}
        {/* Dashboard Content */}
        <section className="content">

          {/* Welcome Section */}
          <div className="welcome">
            <div>
              <p className="eyebrow">
                SECURITY OPERATIONS CENTER
              </p>

              <h1>
                {isOverview
                  ? "Dashboard Overview"
                  : activePage}
              </h1>

              <p className="subtitle">
                {isOverview
                  ? "Monitor your security workspace from one place."
                  : `Welcome to the ${activePage} workspace.`}
              </p>
            </div>

            {/* Backend Status */}
            <div className="system-status">
              <span
                className={`status-dot ${
                  apiStatus === "healthy" ? "" : "offline"
                }`}
              ></span>

              Backend: {apiStatus}
            </div>
          </div>

          {/* Overview Page */}
          {isOverview ? (
            <>                  

              {/* Security Summary */}
              <div className="section-heading">
                <div>
                  <h2>Security Summary</h2>
                  <p>Your workspace at a glance</p>
                </div>

                
              </div>

              <div className="stats-grid">
                <StatCard
  icon={Server}
  label="Total Assets"
  value={dashboardAssets.length}
  note="Registered devices"
  color="blue"
/>

<StatCard
  icon={ShieldCheck}
  label="Security Score"
  value={
    securityScore?.score !== null &&
    securityScore?.score !== undefined
      ? `${securityScore.score}/100`
      : "N/A"
  }
  note={
    securityScore?.status === "Partial"
      ? "Partial assessment"
      : securityScore?.status === "Assessed"
      ? "Based on security assessments"
      : "No assessment available"
  }
  color="green"
/>

<StatCard
  icon={ShieldAlert}
  label="Open Findings"
  value={dashboardVulnerabilities.filter(
    item => (item.status || "").toLowerCase() === "open"
  ).length}
  note="Live vulnerability records"
  color="orange"
/>

<StatCard
  icon={Activity}
  label="Assessments"
  value={securityScore?.assessment_count ?? 0}
  note="Completed and partial assessments"
  color="purple"
/>
              </div>

              {/* Findings and Activity */}
              <div className="dashboard-grid">

                <section className="panel findings-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Recent Findings</h2>
                      <p>Example security observations</p>
                    </div>

                    <button
                      className="text-button"
                      onClick={() =>
                        setActivePage(
                          "Vulnerability Management"
                        )
                      }
                    >
                      View all <ArrowUpRight size={15} />
                    </button>
                  </div>

                  <div className="finding-list">
                    {dashboardLoading ? (
                      <p>Loading vulnerability records...</p>
                    ) : dashboardError ? (
                      <p>{dashboardError}</p>
                    ) : dashboardVulnerabilities.length === 0 ? (
                      <p>No vulnerability records found.</p>
                    ) : (
                      dashboardVulnerabilities
                        .filter((item) =>
                          `${item.title} ${item.target}`
                            .toLowerCase()
                            .includes(search.toLowerCase())
                        )
                        .map((item) => (
                          <div className="finding" key={item.id}>
                            <div className="finding-info">
                              <strong>{item.title}</strong>
                              <span>{item.target}</span>
                            </div>

                            <span
                              className={`severity ${(item.severity || "low").toLowerCase()}`}
                            >
                              {item.severity}
                            </span>

                            <span>{item.status}</span>
                          </div>
                        ))
                    )}
                  </div>
                </section>

                <section className="panel activity-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Recent Activity</h2>
                      <p>Workspace activity log</p>
                    </div>

                    <Clock3
                      size={19}
                      className="muted-icon"
                    />
                  </div>

                  <div className="activity-list">
                    {activities.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          className="activity-item"
                          key={item.title}
                        >
                          <div className="activity-icon">
                            <Icon size={17} />
                          </div>

                          <div>
                            <strong>{item.title}</strong>
                            <span>{item.time}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              {/* Security Modules */}
              <section className="panel modules-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Security Modules</h2>
                    <p>Choose a workspace to explore</p>
                  </div>
                </div>

                <div className="modules-grid">
                  {navigation.slice(1, 6).map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        className="module-card"
                        key={item.name}
                        onClick={() =>
                          setActivePage(item.name)
                        }
                      >
                        <div className="module-icon">
                          <Icon size={22} />
                        </div>

                        <strong>{item.name}</strong>

                        <span>
                          Open module <ArrowUpRight size={14} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </>

          ) : activePage === "Network Scanner" ? (

            /* Network Scanner Page */
            
<section className="panel network-scanner-panel">
  <div className="scanner-header">
    <div className="scanner-title">
      <div className="scanner-icon">
        <Network size={26} />
      </div>
      <div>
        <span className="eyebrow">NETWORK MONITORING</span>
        <h2>Network Scanner</h2>
        <p>Monitor your computer's network information.</p>
      </div>
    </div>

    <span className="scanner-status">
      <span className="status-dot"></span>
      Local Scan
    </span>
  </div>

  <div className="scanner-action-card">
    <div>
      <h3>Network Discovery</h3>
      <p>Retrieve your computer's hostname and IP address.</p>
    </div>

    <button
    className={`primary-button scanner-button ${
  scannerLoading ? "is-scanning" : ""
}`}
      onClick={scanNetwork}
      disabled={scannerLoading}
    >
      <Network size={17} />
      {scannerLoading ? "Scanning..." : "Refresh Scan"}
    </button>
  </div>

  {scannerError && (
    <p className="error-message">{scannerError}</p>
  )}

  {scannerData && (
    <div className="scanner-results">
      <div className="scanner-results-heading">
        <div>
          <span className="eyebrow">SCAN INFORMATION</span>
          <h3>Scan Results</h3>
        </div>
        <span className="scanner-result-badge">
          {scannerData.status}
        </span>
      </div>

      <div className="scanner-result-grid">
        <div className="scanner-result-card">
          <span>HOSTNAME</span>
          <h3>{scannerData.hostname}</h3>
        </div>

        <div className="scanner-result-card">
          <span>IP ADDRESS</span>
          <h3>{scannerData.ip_address}</h3>
        </div>
      </div>
    </div>
  )}
</section>

) : activePage === "Web Security" ? (
  
<section className="panel web-security-panel">
  <div className="web-security-header">
    <div className="web-security-title">
      <div className="web-security-icon">
        <Globe size={27} />
      </div>
      <div>
        <span className="eyebrow">WEB APPLICATION SECURITY</span>
        <h2>Web Security Scanner</h2>
        <p>Review basic security configurations of an authorized website.</p>
      </div>
    </div>

    <span className="web-security-badge">
      <span className="web-security-dot"></span>
      Security Assessment
    </span>
  </div>

  <form onSubmit={scanWebsite} className="web-security-form">
    <div className="web-url-field">
      <Globe size={19} />
      <input
        type="url"
        placeholder="https://example.com"
        value={webSecurityUrl}
        onChange={(e) => setWebSecurityUrl(e.target.value)}
        required
      />
    </div>

    <button
      type="submit"
      className={`primary-button web-scan-button ${
        webSecurityLoading ? "is-scanning" : ""
      }`}
      disabled={webSecurityLoading}
    >
      <ShieldCheck size={18} />
      {webSecurityLoading ? "Checking..." : "Check Website"}
    </button>
  </form>

  {webSecurityError && (
    <p className="error-message">{webSecurityError}</p>
  )}

  {webSecurityResult && (
    <div className="web-security-results">
      <div className="web-results-heading">
        <div>
          <span className="eyebrow">ASSESSMENT REPORT</span>
          <h3>Security Scan Results</h3>
        </div>
        <span className="web-security-badge">
          {webSecurityResult.scan_status}
        </span>
      </div>

      <div className="web-overview-card">
        <h3>Website Overview</h3>
        <div className="web-overview-grid">
          <div className="web-info-item">
            <span>WEBSITE</span>
            <p>{webSecurityResult.website}</p>
          </div>
          <div className="web-info-item">
            <span>HTTP STATUS</span>
            <p>{webSecurityResult.status_code}</p>
          </div>
          <div className="web-info-item">
            <span>RISK LEVEL</span>
            <p>{webSecurityResult.risk_level}</p>
          </div>
          <div className="web-info-item">
            <span>RISK SCORE</span>
            <p>{webSecurityResult.risk_score ?? "Not assessed"}</p>
          </div>
          <div className="web-info-item">
            <span>TOTAL ISSUES</span>
            <p>{webSecurityResult.total_issues}</p>
          </div>
        </div>
        <p className="web-analysis-note">
          {webSecurityResult.analysis_note}
        </p>
      </div>

      <div className="web-detail-grid">
        <div className="web-detail-card">
          <div className="web-card-heading">
            <ShieldCheck size={20} />
            <h3>SSL Certificate</h3>
          </div>
          <div className="web-info-item">
            <span>VALID</span>
            <p>
              {webSecurityResult.ssl_certificate?.valid ? "Yes" : "No"}
            </p>
          </div>
          <div className="web-info-item">
            <span>EXPIRY DATE</span>
            <p>
              {webSecurityResult.ssl_certificate?.expiry_date || "Unavailable"}
            </p>
          </div>
          <div className="web-info-item">
            <span>DAYS REMAINING</span>
            <p>
              {webSecurityResult.ssl_certificate?.days_remaining ?? "Unavailable"}
            </p>
          </div>
        </div>

        <div className="web-detail-card">
          <div className="web-card-heading">
            <Globe size={20} />
            <h3>Cookie Security</h3>
          </div>
          <div className="web-info-item">
            <span>TOTAL COOKIES</span>
            <p>{webSecurityResult.cookie_analysis?.total_cookies ?? 0}</p>
          </div>

          {webSecurityResult.cookie_analysis?.cookie_findings?.length > 0 ? (
            <ul className="web-findings-list">
              {webSecurityResult.cookie_analysis.cookie_findings.map(
                (finding, index) => (
                  <li key={index}>
                    <strong>{finding.issue}</strong>
                    <span>{finding.severity}</span>
                  </li>
                )
              )}
            </ul>
          ) : (
            <p className="web-muted-text">No cookie security findings returned.</p>
          )}
        </div>
      </div>

      <div className="web-detail-card web-severity-card">
        <div className="web-card-heading">
          <Activity size={20} />
          <h3>Severity Summary</h3>
        </div>

        {webSecurityResult.severity_summary ? (
          <div className="web-severity-grid">
            <div className="severity-item severity-high">
              <span>HIGH</span>
              <strong>{webSecurityResult.severity_summary.high}</strong>
            </div>
            <div className="severity-item severity-medium">
              <span>MEDIUM</span>
              <strong>{webSecurityResult.severity_summary.medium}</strong>
            </div>
            <div className="severity-item severity-low">
              <span>LOW</span>
              <strong>{webSecurityResult.severity_summary.low}</strong>
            </div>
          </div>
        ) : (
          <p className="web-muted-text">
            Severity summary unavailable because the scan was inconclusive.
          </p>
        )}
      </div>

      <div className="web-detail-card web-findings-card">
        <div className="web-card-heading">
          <Bug size={20} />
          <h3>Security Findings</h3>
        </div>

        {webSecurityResult.findings?.length > 0 ? (
          <ul className="web-findings-list">
            {webSecurityResult.findings.map((finding, index) => (
              <li key={index}>
                <strong>{finding.issue}</strong>
                <span>{finding.severity}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="web-muted-text">
            No findings returned, or the scan was inconclusive.
          </p>
        )}
      </div>
    </div>
  )}
</section>

          ) : activePage === "Asset Inventory" ? (

            /* Asset Inventory Page */
            <section className="panel asset-panel">

              <div className="panel-heading">
                <div>
                  <h2>Registered Devices</h2>
                  <p>
                    Manage your authorized network assets.
                  </p>
                </div>
<div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
  <button
    className="primary-button"
    onClick={discoverDevice}
    disabled={discoveryLoading}
  >
    {discoveryLoading ? "Discovering..." : "Auto Discover"}
  </button>

  <button
    className="primary-button"
    onClick={() => setShowAssetForm(!showAssetForm)}
  >
    {showAssetForm ? "Close Form" : "Add Device"}
  </button>
</div>
              </div>
{discoveredDevice && (
  <div className="scanner-results">
    <h3>Discovered Device</h3>
    <p><strong>Device Name:</strong> {discoveredDevice.device_name}</p>
    <p><strong>IP Address:</strong> {discoveredDevice.ip_address}</p>
    <p><strong>Operating System:</strong> {discoveredDevice.device_type}</p>
    <p><strong>Status:</strong> {discoveredDevice.status}</p>

    <button
      className="primary-button"
      onClick={registerDiscoveredDevice}
    >
      Add to Asset Inventory
    </button>

    <button
      className="text-button"
      onClick={() => setDiscoveredDevice(null)}
    >
      Cancel
    </button>
  </div>
)}
              {/* Add Device Form */}
              {showAssetForm && (
                <form
                  onSubmit={addAsset}
                  className="asset-form"
                >
                  <input
                    type="text"
                    placeholder="Device Name"
                    value={assetForm.device_name}
                    onChange={(e) =>
                      setAssetForm({
                        ...assetForm,
                        device_name: e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    type="text"
                    placeholder="IP Address"
                    value={assetForm.ip_address}
                    onChange={(e) =>
                      setAssetForm({
                        ...assetForm,
                        ip_address: e.target.value,
                      })
                    }
                    required
                  />

                  <select
                    value={assetForm.device_type}
                    onChange={(e) =>
                      setAssetForm({
                        ...assetForm,
                        device_type: e.target.value,
                      })
                    }
                  >
                    <option value="Laptop">Laptop</option>
                    <option value="Desktop">Desktop</option>
                    <option value="Server">Server</option>
                    <option value="Router">Router</option>
                    <option value="Other">Other</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Description"
                    value={assetForm.description}
                    onChange={(e) =>
                      setAssetForm({
                        ...assetForm,
                        description: e.target.value,
                      })
                    }
                  />

                  <button
                    type="submit"
                    className="primary-button"
                  >
                    Register Device
                  </button>
                </form>
              )}

              {/* Error Message */}
              {assetError && (
                <p className="error-message">
                  {assetError}
                </p>
              )}

              {/* Refresh Devices */}
              <button
                className="text-button"
                onClick={fetchAssets}
                disabled={assetLoading}
              >
                {assetLoading
                  ? "Loading..."
                  : "Refresh Devices"}
              </button>

              {/* Assets Table */}
             <div className="table-container">
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Device Name</th>
        <th>IP Address</th>
        <th>Type</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>

    <tbody>
      {assets.map((asset) => (
        <tr key={asset.id}>
          <td>{asset.id}</td>
          <td>{asset.device_name}</td>
          <td>{asset.ip_address}</td>
          <td>{asset.device_type}</td>
          <td>{asset.status}</td>

          <td>
            <button
              className="text-button"
              onClick={() => startEditAsset(asset)}
            >
              Edit
            </button>

            <button
              className="text-button"
              onClick={() => deleteAsset(asset.id)}
            >
              Delete
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  {!assetLoading && assets.length === 0 && (
    <p className="empty-message">
      No devices found.
    </p>
  )}
</div>
            </section>
            ) : activePage === "My Progress" ? (
  <section className="panel progress-panel">
    <div className="panel-heading">
      <div>
        <h2>My Learning Progress</h2>
        <p>Track your cybersecurity academy performance.</p>
      </div>
      <ChartNoAxesColumn size={28} />
    </div>

    <div className="stats-grid">
      <div className="module-card">
  <h3>{levelName}</h3>
  <p>Level {currentLevel}</p>

  <div className="level-progress">
    <div
      className="level-progress-fill"
      style={{ width: `${levelProgress}%` }}
    />
  </div>

  <p>{xpIntoLevel} / 100 XP</p>
  <p>{xpNeeded} XP needed for the next level</p>
</div>
      <StatCard
        icon={Trophy}
        label="Total XP"
        value={totalXP}
        note="Points earned"
        color="blue"
      />

     <StatCard
  icon={BookOpen}
  label="Current Level"
  value={currentLevel}
  note={levelName}
  color="green"
/>

      <StatCard
        icon={Target}
        label="Quizzes Completed"
        value={quizzesCompleted}
        note="Completed quizzes"
        color="orange"
      />

      <StatCard
        icon={Award}
        label="Challenges Completed"
        value={challengesCompleted}
        note={`Out of ${challenges.length}`}
        color="purple"
      />
    </div>

    <div className="module-card">
      <h3>Academy Activity</h3>
      <p>Quiz progress: {quizFinished ? "Completed" : "In progress"}</p>
      <p>
        Challenge progress: {challengesCompleted} / {challenges.length}
      </p>
    </div>
  </section>
            ) : activePage === "Achievements" ? (
  <section className="panel achievements-panel">
    <div className="panel-heading">
      <div>
        <h2>My Achievements</h2>
        <p>Earn badges by learning and completing cybersecurity activities.</p>
      </div>
      <badge color="success">
  {achievements.filter((item) => item.unlocked).length} / 5 Unlocked
</badge>
    </div>

    <div className="modules-grid">
      {achievements.map((achievement) => {
        const Icon = achievement.icon;

        return (
          <div
  className={`module-card ${
    achievement.unlocked ? "achievement-unlocked" : ""
  }`}
  key={achievement.title}
>
            <div className="module-icon">
              <Icon size={28} />
            </div>

            <strong>{achievement.title}</strong>
            <p>{achievement.description}</p>

           <span className="achievement-reward">
  {achievement.unlocked
    ? "🏆 Achievement Unlocked!"
    : "🔒 Not Unlocked"}
</span>
          </div>
        );
      })}
    </div>
  </section>
            ) : activePage === "Real-Life Challenges" ? (
  <section className="panel challenges-panel">
    <div className="panel-heading">
      <div>
        <h2>Real-Life Cyber Challenges</h2>
        <p>Test your decision-making through everyday cybersecurity scenarios.</p>
      </div>
    </div>

    {!challengeFinished ? (
      <div className="module-card">
        <span>CHALLENGE {challengeQuestionCount} · {challengeQuestion?.difficulty || backendAcademyProgress?.difficulty || "Loading"}</span>
        {challengeQuestion ? <><h2>{challengeQuestion.topic}</h2><p>{challengeQuestion.scenario}</p><h3>{challengeQuestion.prompt}</h3></> : <p>{challengeFeedback?.message || challengeFeedback?.error || "Loading your next challenge…"}</p>}

        <div className="challenge-options">
  {(challengeQuestion?.options || []).map((option, index) => (
    <button
      key={index}
      type="button"
      className={`challenge-option ${
        challengeFeedback?.selectedOption === index ? "selected" : ""
      }`}
      disabled={!challengeQuestion || challengeFeedback !== null}
      onClick={() => {
        submitDynamicAnswer("challenge", index).catch(error => setChallengeFeedback({ error: error.message }));
      }}
    >
      <span className="option-letter">
        {String.fromCharCode(65 + index)}
      </span>
      <span className="option-text">{option}</span>
    </button>
  ))}
</div>

        {challengeFeedback && !challengeFeedback.error && (
          <div>
            <h3>{challengeFeedback.correct ? "Correct answer" : "Review this response"}</h3>
            <p>{challengeFeedback.explanation}</p>

            <button
              className="primary-button"
              onClick={async () => { const next = await loadDynamicQuestion("challenge"); if (next.exhausted) { setChallengeQuestion(null); setChallengeFeedback({ exhausted: true, message: next.message }); } else { setChallengeQuestion(next); setChallengeFeedback(null); setChallengeQuestionCount(count => count + 1); } }}
            >
              Next challenge
            </button>
          </div>
        )}
        {challengeFeedback?.error && <p role="alert">{challengeFeedback.error}</p>}
        {challengeFeedback?.exhausted && <div><p>{challengeFeedback.message}</p><button className="primary-button" onClick={async () => { setChallengeFinished(false); setChallengeScore(0); setChallengeQuestionCount(0); const q=await loadDynamicQuestion("challenge",true); setChallengeQuestion(q); setChallengeQuestionCount(1); }}>Start a new challenge cycle</button></div>}
      </div>
    ) : (
  <div className="module-card">
    <h2>Challenge session complete</h2>

    <h3>
      Correct answers: {challengeScore}
    </h3>

    <p>
      Your progress and XP are saved to your authenticated account.
    </p>

    <p>
      Academy XP: {backendAcademyProgress?.xp ?? "—"}
    </p>

    <button
      className="primary-button"
      onClick={() => {
        setChallengeIndex(0);
        setChallengeAnswer(null);
        setChallengeScore(0);
        setChallengeFinished(false);
      }}
    >
      Try Again
    </button>
  </div>
)}
  </section>
) : activePage === "Learning Levels" ? (

  /* Learning Levels */
  <section className="panel learning-levels-panel">
    <div className="panel-heading">
      <div>
        <h2>Cybersecurity Learning Levels</h2>
        <p>Complete each level to progress through the academy.</p>
      </div>
      <badge color="success">Level 1 Available</badge>
    </div>

    <div className="modules-grid">
      {learningTopics.map((topic, index) => {
        const unlocked = index === 0;
        const Icon = unlocked ? BookOpen : ShieldCheck;

        return (
          <div className="module-card" key={topic}>
            <div className="module-icon">
              <Icon size={23} />
            </div>

            <span>LEVEL {index + 1}</span>
            <strong>{topic}</strong>

            <p>
              {unlocked
                ? "Available — Start learning"
                : "Locked — Complete previous levels"}
            </p>

            <button
              className="primary-button"
              disabled={!unlocked}
              onClick={() =>
                alert(`Welcome to ${topic}! Lessons coming next.`)
              }
            >
              {unlocked ? "Start Level" : "Locked"}
            </button>
          </div>
        );
      })}
    </div>
  </section>
  ) : activePage === "Quiz Arena" ? (

  /* Quiz Arena */
  <section className="panel quiz-arena-panel">
    <div className="panel-heading">
      <div>
        <h2>Cybersecurity Quiz Arena</h2>
        <p>Test your knowledge and earn XP!</p>
      </div>
      <Trophy size={28} />
    </div>

    {!quizFinished ? (
      <>
        <p>Question {quizQuestionCount} · {quizQuestion?.difficulty || backendAcademyProgress?.difficulty || "Loading"} · {quizQuestion?.topic || "Social engineering"}</p>
        {quizQuestion ? <h3>{quizQuestion.prompt}</h3> : <p>{quizFeedback?.message || quizFeedback?.error || "Loading your next question…"}</p>}

        <div className="quiz-options">
          {(quizQuestion?.options || []).map((option, index) => (
            <button
              key={index}
              className={`module-card ${
                selectedAnswer === index ? "active" : ""
              }`}
              disabled={quizFeedback !== null}
              onClick={() => {
                submitDynamicAnswer("quiz", index).catch(error => setQuizFeedback({ error: error.message, selectedOption: index }));
              }}
            >
              {String.fromCharCode(65 + index)}. {option}
            </button>
          ))}
        </div>

        {quizFeedback && !quizFeedback.error && !quizFeedback.exhausted && (
          <div className="notice">
            <div>
              <strong>{quizFeedback.correct ? "Correct answer" : "Review this answer"} · {quizFeedback.xp_awarded} XP earned</strong>
              <p>{quizFeedback.explanation}</p>
            </div>
          </div>
        )}

        {quizFeedback && !quizFeedback.error && !quizFeedback.exhausted && (
          <button
            className="primary-button"
            onClick={async () => { const next=await loadDynamicQuestion("quiz"); if(next.exhausted){setQuizQuestion(null);setQuizFeedback({exhausted:true,message:next.message});}else{setQuizQuestion(next);setQuizFeedback(null);setQuizQuestionCount(count=>count+1);} }}
          >
            Next question
          </button>
        )}
        {quizFeedback?.error && <p role="alert">{quizFeedback.error}</p>}
        {quizFeedback?.exhausted && <div><p>{quizFeedback.message}</p><button className="primary-button" onClick={async()=>{setQuizQuestion(null);setQuizFeedback(null);setQuizScore(0);setQuizQuestionCount(0);const q=await loadDynamicQuestion("quiz",true);setQuizQuestion(q);setQuizQuestionCount(1);}}>Start a new question cycle</button></div>}
      </>
    ) : (
      <div className="placeholder-panel">
        <Trophy size={42} />
        <h2>Quiz Completed!</h2>
        <h3>
          Correct answers: {quizScore}
        </h3>
        <p>Academy XP: {backendAcademyProgress?.xp ?? "—"}</p>

        <button
          className="primary-button"
          onClick={() => {
            setQuizIndex(0);
            setQuizScore(0);
            setSelectedAnswer(null);
            setQuizFinished(false);
          }}
        >
          Try Again
        </button>
      </div>
    )}
  </section>

) : activePage === "Academy Dashboard" ? (

  /* Social Engineering Academy Dashboard */
  <section className="academy-dashboard">

    <div className="panel academy-welcome-panel">
  <p className="eyebrow">
    CYBERSHIELD X LEARNING ACADEMY
  </p>

  <h2 className="text-white! text-2xl font-bold mt-3 mb-4">
    Welcome to Cyber Security Academy!
  </h2>

  <p className="text-slate-300 leading-relaxed mb-6">
    Learn cybersecurity through interactive quizzes,
    real-life scenarios and guided challenges.
  </p>

  <button
    className="primary-button px-6! py-3! mt-3"
    onClick={() => setActivePage("Learning Levels")}
  >
    Start Learning
  </button>
</div>

    <div className="stats-grid">
      <StatCard
        icon={Trophy}
        label="Total XP"
        value={totalXP}
note="Points earned"
        color="blue"
      />

      <StatCard
  icon={BookOpen}
  label="Current Level"
  value={currentLevel}
  note={levelName}
  color="green"
/>

      <StatCard
        icon={Target}
        label="Quizzes Completed"
        value={quizzesCompleted}
note="Completed quizzes"
        color="orange"
      />

      <StatCard
        icon={Award}
        label="Achievements"
        value={quizzesCompleted + (challengesCompleted > 0 ? 1 : 0)}
note="Activities completed"
        color="purple"
      />
    </div>

    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Your Learning Journey</h2>
          <p>Track your academy progress</p>
        </div>
      </div>

      <div style={{
        background: "#252c3a",
        height: "12px",
        borderRadius: "10px",
        overflow: "hidden"
      }}>
        <div style={{
          width: `${academyProgress}%`,
          height: "100%",
          background: "#38bdf8"
        }} />
      </div>

      <p>{academyProgress}% completed — Keep learning!</p>
    </section>

    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Explore Academy</h2>
          <p>Choose your next learning activity</p>
        </div>
      </div>

      <div className="modules-grid">
        {[
          {
            name: "Learning Levels",
            icon: BookOpen,
            description: "Explore cybersecurity topics"
          },
          {
            name: "Quiz Arena",
            icon: Trophy,
            description: "Test your knowledge"
          },
          {
            name: "Real-Life Challenges",
            icon: Target,
            description: "Solve security scenarios"
          },
          {
            name: "AI Cyber Assistant",
            icon: Bot,
            description: "Get learning assistance"
          },
          {
            name: "Achievements",
            icon: Award,
            description: "Unlock learning badges"
          },
          {
            name: "My Progress",
            icon: ChartNoAxesColumn,
            description: "Review your progress"
          }
        ].map((item) => {
          const Icon = item.icon;

          return (
            <button
              className="module-card"
              key={item.name}
              onClick={() => setActivePage(item.name)}
            >
              <div className="module-icon">
                <Icon size={22} />
              </div>

              <strong>{item.name}</strong>
              <p>{item.description}</p>

              <span>
                Explore <ArrowUpRight size={14} />
              </span>
            </button>
          );
        })}
      </div>
    </section>

  </section>

) : activePage === "OS Security" ? (
  <section className="panel os-security-panel">

    {/* Header */}
    <div className="os-security-header">
      <div className="os-security-title">
        <div className="os-security-icon">
          <Monitor size={27} />
        </div>
        <div>
          <span className="eyebrow">SYSTEM PROTECTION</span>
          <h2>Operating System Security</h2>
          <p>Review important security settings on your device.</p>
        </div>
      </div>

      <span className="os-security-badge">
        <span className="os-status-dot"></span>
        Device Assessment
      </span>
    </div>

    {/* Scan controls */}
    <div className="os-scan-action-card">
      <div>
        <h3>Automatic Security Assessment</h3>
        <p>
          Check important operating system security configurations
          and identify settings that may need attention.
        </p>
      </div>

      <button
        className={`primary-button os-scan-button ${
          scanning ? "is-scanning" : ""
        }`}
        onClick={runOSScan}
        disabled={scanning}
      >
        <ShieldCheck size={18} />
        {scanning ? "Scanning..." : "Start Automatic Scan"}
      </button>
    </div>

    <section className="encryption-lab" aria-labelledby="encryption-lab-title">
      <div className="encryption-lab-heading"><div><span className="eyebrow">SAFE TEXT-ONLY EXERCISE</span><h3 id="encryption-lab-title">Encryption Lab</h3><p>Practice protecting a message without changing files or device data.</p></div><span className="encryption-algorithm">AES-256-GCM</span></div>
      <div className="encryption-learning-grid">
        <p><strong>Encryption</strong> turns readable text into ciphertext using a secret key.</p>
        <p><strong>Key</strong> unlocks the message. This lab creates a new random 256-bit key each time.</p>
        <p><strong>Nonce</strong> is a unique value used for one encryption with that key. Never reuse it with the same key.</p>
        <p><strong>Authentication</strong> detects a wrong key or changed ciphertext before returning any text.</p>
      </div>
      <label className="encryption-field">Text to encrypt<textarea maxLength={10000} rows={4} value={labPlaintext} onChange={event => setLabPlaintext(event.target.value)} placeholder="Enter an educational sample message" /></label>
      <button className="primary-button encryption-action" onClick={encryptLabText} disabled={labLoading}>{labLoading ? "Working…" : "Encrypt text"}</button>
      {labMessage.text && <p className={`encryption-feedback ${labMessage.type}`} role="status">{labMessage.text}</p>}
      {labCiphertext && <div className="encryption-output-grid">
        <label className="encryption-field">Ciphertext (Base64)<textarea rows={3} value={labCiphertext} onChange={event => setLabCiphertext(event.target.value)} spellCheck="false" /></label>
        <label className="encryption-field">Key (Base64)<div className="encryption-copy-row"><input value={labKey} onChange={event => setLabKey(event.target.value)} spellCheck="false" /><button type="button" onClick={() => navigator.clipboard?.writeText(labKey)}>Copy</button></div></label>
        <label className="encryption-field">Nonce (Base64)<div className="encryption-copy-row"><input value={labNonce} onChange={event => setLabNonce(event.target.value)} spellCheck="false" /><button type="button" onClick={() => navigator.clipboard?.writeText(labNonce)}>Copy</button></div></label>
        <button className="primary-button encryption-action" onClick={decryptLabText} disabled={labLoading}>{labLoading ? "Working…" : "Decrypt with key and nonce"}</button>
        {labDecrypted !== "" && <label className="encryption-field">Decrypted text<textarea rows={3} value={labDecrypted} readOnly /></label>}
      </div>}
    </section>

    {scanError && (
      <div className="os-notice">
        <ShieldAlert size={21} />
        <p>{scanError}</p>
      </div>
    )}

    {/* Warning guide */}
    {selectedOSWarning && osWarningGuides[selectedOSWarning] && (
      <div className="os-warning-guide">
        <button
          className="text-button os-back-button"
          onClick={() => setSelectedOSWarning(null)}
        >
          ← Back to Scan Results
        </button>

        <div className="os-guide-heading">
          <ShieldAlert size={24} />
          <div>
            <span className="eyebrow">SECURITY EXPLANATION</span>
            <h2>{osWarningGuides[selectedOSWarning].title}</h2>
          </div>
        </div>

        <div className="os-guide-section">
          <h3>Possible Cause</h3>
          <p>{osWarningGuides[selectedOSWarning].cause}</p>
        </div>

        <div className="os-guide-section">
          <h3>Why This Matters</h3>
          <p>{osWarningGuides[selectedOSWarning].why}</p>
        </div>

        <div className="os-guide-section">
          <h3>How to Review and Fix</h3>
          <ol>
            {osWarningGuides[selectedOSWarning].steps.map(
              (step, index) => (
                <li key={index}>{step}</li>
              )
            )}
          </ol>
        </div>

        <button
          className="primary-button os-scan-button"
          onClick={() => {
            setSelectedOSWarning(null);
            runOSScan();
          }}
        >
          <ShieldCheck size={18} />
          Re-scan to Verify
        </button>
      </div>
    )}

    {/* Scan results */}
    {scanResults && !selectedOSWarning && (
      <div className="os-scan-results">
        <div className="os-results-heading">
          <div>
            <span className="eyebrow">ASSESSMENT REPORT</span>
            <h2>Automatic Scan Results</h2>
          </div>

          <span className="os-completed-badge">
            <span className="os-status-dot"></span>
            Scan Completed
          </span>
        </div>

        <div className="os-device-card">
          <div className="os-device-icon">
            <Monitor size={22} />
          </div>
          <div>
            <span>DETECTED OPERATING SYSTEM</span>
            <h3>{scanResults.os}</h3>
          </div>
        </div>

        <div className="os-checks-heading">
          <h3>Security Configuration Checks</h3>
          <span>
            {Object.keys(scanResults.checks || {}).length} Checks
          </span>
        </div>

        <div className="os-check-list">
          {Object.entries(scanResults.checks || {}).map(
            ([name, result]) => (
              <div className="os-scan-result-item" key={name}>
                <div className="os-result-information">
                  <strong>{name.replaceAll("_", " ").toUpperCase()}</strong>
                  <p>{result.details}</p>

                  {result.status === "warning" &&
                    osWarningGuides[name] && (
                      <button
                        className="text-button os-fix-button"
                        onClick={() => setSelectedOSWarning(name)}
                      >
                        View Cause &amp; Solution →
                      </button>
                    )}
                </div>

                <span className={`scan-status ${result.status}`}>
                  {result.status.toUpperCase()}
                </span>
              </div>
            )
          )}
        </div>

        {scanResults.message && (
          <div className="os-scan-message">
            <p>{scanResults.message}</p>
          </div>
        )}
      </div>
    )}

  </section>

) : activePage === "Vulnerability Management" ? (
  <section className="panel vulnerability-panel">

    <div className="panel-heading">
      <div>
        <h2>Vulnerability Management</h2>
        <p>Monitor detected findings and track remediation progress.</p>
      </div>

      <button
        className="primary-button"
        onClick={loadVulnerabilities}
        disabled={vulnerabilityLoading}
      >
        {vulnerabilityLoading ? "Refreshing..." : "Refresh Findings"}
      </button>
    </div>

    {vulnerabilityError && (
      <p className="error-message">{vulnerabilityError}</p>
    )}

    {vulnerabilityLoading ? (
      <p>Loading vulnerability findings...</p>
    ) : (
      <>
        <div className="stats-grid">
      <StatCard
  icon={Server}
  label="Total Assets"
  value={dashboardAssets.length}
  note="Registered devices"
  color="blue"
/>

<StatCard
  icon={ShieldCheck}
  label="Security Score"
  value="N/A"
  note="No verified score available"
  color="green"
/>

<StatCard
  icon={ShieldAlert}
  label="Open Findings"
  value={dashboardVulnerabilities.filter(
    item => (item.status || "").toLowerCase() === "open"
  ).length}
  note="Live vulnerability records"
  color="orange"
/>

<StatCard
  icon={Activity}
  label="Assessments"
  value="N/A"
  note="Assessment history not connected"
  color="purple"
/>
        </div>

        <div className="section-heading">
          <div>
            <h2>Detected Findings</h2>
            <p>Findings collected from completed Web Security assessments.</p>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Finding</th>
                <th>Target Website</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Recommendation</th>
              </tr>
            </thead>

            <tbody>
              {vulnerabilities.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td><strong>{item.title}</strong></td>
                  <td>{item.target}</td>
                  <td>
                    <span className={`severity ${item.severity.toLowerCase()}`}>
                      {item.severity}
                    </span>
                  </td>
                  <td>{item.status}</td>
                  <td>{item.recommendation || "No recommendation available"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {vulnerabilities.length === 0 && (
            <p className="empty-message">
              No vulnerability findings recorded yet. Run a completed Web Security assessment.
            </p>
          )}
        </div>
      </>
    )}
  </section>
  ) : activePage === "AI Cyber Assistant" ? (
  <section className="panel ai-chat-panel">
    <div className="panel-heading">
      <div>
        <h2><Bot size={22} /> CyberShield AI</h2>
        <p>Your AI assistant for ethical hacking and cybersecurity learning.</p>
      </div>

      <button
        className="text-button"
        onClick={() => {
          setChatMessages([{
            role: "assistant",
            content: "Hello! I'm CyberShield AI. Ask me anything about ethical hacking, cybersecurity, networking, or secure coding."
          }]);
          setChatError("");
        }}
      >
        Clear Chat
      </button>
    </div>

    <div className="chat-messages">
      {chatMessages.map((item, index) => (
        <div className={`chat-message ${item.role}`} key={index}>
          <strong>{item.role === "user" ? "You" : "CyberShield AI"}</strong>
          <div className="chat-response-content">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {item.content}
  </ReactMarkdown>
</div>
          <div ref={chatEndRef} />
        </div>
      ))}

      {chatLoading && (
        <div className="chat-message assistant">
          <strong>CyberShield AI</strong>
          <p>Thinking...</p>
        </div>
      )}
    </div>

    {chatError && <p className="error-message">{chatError}</p>}

    <form className="chat-input-form" onSubmit={sendChatMessage}>
      <input
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        placeholder="Ask about ethical hacking..."
        disabled={chatLoading}
      />

      <button
        className="primary-button"
        type="submit"
        disabled={chatLoading || !chatInput.trim()}
      >
        Send
      </button>
    </form>

    <p className="chat-disclaimer">
      Use the assistant for authorized, legal cybersecurity learning and defensive work.
    </p>
  </section>
) : (
  /* Placeholder for Other Modules */
  <section className="panel placeholder-panel">
    <div className="placeholder-icon">
      <ShieldCheck size={34} />
    </div>

    <h2>{activePage}</h2>

    <p>
      This module is part of the CyberShield X workspace.
      We will build its features in the next development steps.
    </p>

    <button
      className="primary-button"
      onClick={() => setActivePage("Overview")}
    >
      Back to Overview
    </button>
  </section>
)}

          {/* Footer */}
          <footer className="footer">
            CyberShield X <span>•</span>{" "}
            Educational Security Assessment Platform
          </footer>

        </section>
      </main>
    </div>
  );
}

// Reusable Statistics Card

function StatCard({ icon: Icon, label, value, note, color }) {
  const accents = {
    blue: "bg-sky-500/10 text-sky-400 ring-sky-500/20",
    green: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    orange: "bg-orange-500/10 text-orange-400 ring-orange-500/20",
    purple: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
  };

  return (
    <Card className="group border border-slate-800 bg-slate-950/80 text-slate-100 shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/40">
      <CardContent className="flex items-start gap-4 p-5 text-left">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ${
            accents[color] || accents.blue
          }`}
        >
          <Icon size={22} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-400">
            {label}
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white!">
  {value}
</h2>

          <p className="mt-1 text-xs text-slate-500">
            {note}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


export default App;

