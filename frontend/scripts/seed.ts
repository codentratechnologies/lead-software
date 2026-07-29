import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, serverTimestamp } from 'firebase/database';
import dotenv from 'dotenv';

// Load variables from .env.local
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

if (!firebaseConfig.projectId || firebaseConfig.projectId === "") {
  console.error("❌ ERROR: Firebase configuration is missing.");
  console.error("Please add your Firebase details to .env.local before running this script.");
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const demoLeads = [
  {
    company: { name: "TechNova Solutions", industry: "SaaS", website: "https://technova.example.com" },
    contact_person: "Sarah Jenkins",
    email: "sarah@technova.example.com",
    phone: "+1-555-0101",
    problems_identified: "High customer churn rate and inefficient onboarding process.",
    recommended_solution: "Implement an automated lifecycle marketing tool.",
    lead_score: 85,
    status: "New",
    source: "linkedin"
  },
  {
    company: { name: "Global Logistics Inc", industry: "Transportation", website: "https://globallogistics.example.com" },
    contact_person: "Mike Chen",
    email: "m.chen@globallogistics.example.com",
    phone: "+1-555-0102",
    problems_identified: "Losing track of fleet vehicles in poor network zones.",
    recommended_solution: "Offline-first tracking system with batch synchronization.",
    lead_score: 92,
    status: "Contacted",
    source: "maps"
  },
  {
    company: { name: "Apex Fitness", industry: "Health & Wellness", website: "https://apexfitness.example.com" },
    contact_person: "Jessica Alba",
    email: "jessica@apexfitness.example.com",
    phone: "+1-555-0103",
    problems_identified: "Difficulty managing memberships and class schedules across 5 branches.",
    recommended_solution: "Unified CRM for gym management.",
    lead_score: 78,
    status: "New",
    source: "instagram"
  },
  {
    company: { name: "Urban Architecture", industry: "Construction", website: "https://urbanarch.example.com" },
    contact_person: "David Wright",
    email: "david@urbanarch.example.com",
    phone: "+1-555-0104",
    problems_identified: "Project delays due to miscommunication between contractors.",
    recommended_solution: "Centralized project management dashboard.",
    lead_score: 65,
    status: "New",
    source: "linkedin"
  },
  {
    company: { name: "Sunrise Bakeries", industry: "Food & Beverage", website: "https://sunrisebakeries.example.com" },
    contact_person: "Elena Rodriguez",
    email: "elena@sunrisebakeries.example.com",
    phone: "+1-555-0105",
    problems_identified: "High inventory waste due to unpredictable daily demand.",
    recommended_solution: "AI-powered demand forecasting software.",
    lead_score: 88,
    status: "Qualified",
    source: "maps"
  },
  {
    company: { name: "FinTrust Advisors", industry: "Finance", website: "https://fintrust.example.com" },
    contact_person: "Robert Chang",
    email: "r.chang@fintrust.example.com",
    phone: "+1-555-0106",
    problems_identified: "Compliance reporting is taking too much manual time.",
    recommended_solution: "Automated compliance generation tool.",
    lead_score: 95,
    status: "New",
    source: "linkedin"
  },
  {
    company: { name: "EcoSmart Energy", industry: "Renewable Energy", website: "https://ecosmart.example.com" },
    contact_person: "Laura Smith",
    email: "laura@ecosmart.example.com",
    phone: "+1-555-0107",
    problems_identified: "Customer acquisition costs are too high for solar panel installations.",
    recommended_solution: "Targeted digital marketing and lead qualification funnel.",
    lead_score: 72,
    status: "Contacted",
    source: "instagram"
  },
  {
    company: { name: "NextGen Robotics", industry: "Manufacturing", website: "https://nextgenrobotics.example.com" },
    contact_person: "Dr. Alan Turing",
    email: "alan@nextgenrobotics.example.com",
    phone: "+1-555-0108",
    problems_identified: "Supply chain bottlenecks for specialized microchips.",
    recommended_solution: "Alternative supplier discovery platform.",
    lead_score: 81,
    status: "New",
    source: "maps"
  },
  {
    company: { name: "BlueWave Marketing", industry: "Marketing", website: "https://bluewave.example.com" },
    contact_person: "Samantha Lee",
    email: "sam@bluewave.example.com",
    phone: "+1-555-0109",
    problems_identified: "Struggling to attribute conversions accurately across multiple channels.",
    recommended_solution: "Multi-touch attribution analytics software.",
    lead_score: 89,
    status: "Qualified",
    source: "linkedin"
  },
  {
    company: { name: "Pinnacle Healthcare", industry: "Healthcare", website: "https://pinnaclehealth.example.com" },
    contact_person: "Dr. James Wilson",
    email: "j.wilson@pinnaclehealth.example.com",
    phone: "+1-555-0110",
    problems_identified: "Patient no-show rates are affecting revenue.",
    recommended_solution: "Automated SMS and WhatsApp appointment reminders.",
    lead_score: 94,
    status: "New",
    source: "instagram"
  }
];

async function seedDatabase() {
  console.log("🌱 Seeding database with 10 demo leads...");
  const leadsRef = ref(db, 'leads');

  try {
    for (const lead of demoLeads) {
      await push(leadsRef, {
        ...lead,
        campaign_id: "demo-campaign-123",
        created_at: serverTimestamp()
      });
    }
    console.log("✅ Successfully seeded 10 leads to Firebase Realtime Database!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed database:", error);
    process.exit(1);
  }
}

seedDatabase();
