import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, X, ArrowLeft, Home, Star, User,
  Plus, Minus, Sparkles, Heart, Users, MapPin, Info,
  ChevronLeft, ChevronRight, ArrowUp, Plane, Car, Building2,
  Clock, Utensils, Zap, List, Video, Link, CheckCircle2,
} from "lucide-react";
import cleartripLogo from "@/imports/image-1.png";

import { TextRotate } from "../components/TextRotate";
import { CirclingElements } from "../components/CirclingElements";

// ── Palette ───────────────────────────────────────────────────────────────
const C = {
  coral:     "#F85010",
  orange:    "#F88828",
  coralSoft: "#FEEDE2",
  teal:      "#2E6E6A",
  tealSoft:  "#E4F0EE",
  ground:    "#F9F9F9",
  card:      "#F7F2EA",
  ink:       "#16130F",
  sub:       "#6B6259",
  good:      "#1E7A4C",
  warn:      "#B45309",
  hair:      "#EFE9E1",
  // Card chrome — from Cleartrip reference (image-3)
  cardBg:    "#FFFFFF",           // pure white card surface
  cardBorder:"#EBEBEB",           // cool-gray, barely visible border
  cardDivide:"#F2F2F2",           // internal section dividers (even lighter)
  cardFoot:  "#FAFAFA",           // footer zones inside cards (near-white)
  cardShadow:"0 1px 6px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)", // whisper shadow
} as const;

// ── Typography scale (Inter) ──────────────────────────────────────────────
const T = {
  screenTitle:  "21px",   // Bold 700 — screen/section headings
  primaryValue: "19px",   // Bold 700 — entity names, key values (city, hotel name)
  sectionValue: "15px",   // SemiBold 600 — dates, prices, strong secondary values
  body:         "13.5px", // Regular 400 — descriptive text, addresses, amenities
  label:        "12px",   // Regular 400, gray — labels above values
  caption:      "11.5px", // Regular 400, gray — pills, meta, ratings, taxes
  micro:        "11px",   // Regular 400, gray — time stamps, tiny annotations
} as const;

// ── Types ─────────────────────────────────────────────────────────────────
type MainScreen  = "home" | "processing" | "results" | "video-processing";
type SheetStep   = "location-dates" | "who" | "budget" | "interests";
type TransportMode = "train" | "flight" | "both";
type DateMode    = "fixed" | "flexible";
type GroupType   = "solo" | "partner" | "friends" | "family";
type ResultsTab  = "logistics" | "itinerary";

// ── Data ──────────────────────────────────────────────────────────────────
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_FULL  = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// Popular Indian destinations shown by default
const DEFAULT_SUGGESTIONS = [
  { name: "Goa",      sub: "North & South Goa, India",      img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=120" },
  { name: "Jaipur",   sub: "Rajasthan, India",               img: "https://images.unsplash.com/photo-1477587458883-47145ed6979c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=120" },
  { name: "Manali",   sub: "Himachal Pradesh, India",        img: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=120" },
  { name: "Udaipur",  sub: "Rajasthan, India",               img: "https://images.unsplash.com/photo-1599661046289-e31897846e41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=120" },
];

// Kerala-specific suggestions when user searches "kerala"
const KERALA_SUGGESTIONS = [
  { name: "Munnar",                    sub: "Idukki, Kerala, India",         img: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=120" },
  { name: "Alleppey (Alappuzha)",      sub: "Alappuzha, Kerala, India",      img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=120" },
  { name: "Fort Kochi",                sub: "Ernakulam, Kerala, India",      img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=120" },
  { name: "Thekkady",                  sub: "Idukki, Kerala, India",         img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=120" },
];

type ActivityChip = { label: string; img: string };

const CHIPS_DEFAULT: ActivityChip[] = [
  { label: "Backwater Houseboat Cruise",  img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Tea Garden Walks",            img: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Kathakali Dance Show",        img: "https://images.unsplash.com/photo-1617040941567-b1bfc1a9f37c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Ayurvedic Spa & Wellness",   img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Elephant Sanctuary Visit",   img: "https://images.unsplash.com/photo-1549366021-9f761d450615?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Spice Plantation Tour",      img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Varkala Cliff Beach",        img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Kerala Sadya Feast",         img: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Chinese Fishing Nets",       img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Periyar Tiger Reserve",      img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Fort Kochi Heritage Walk",   img: "https://images.unsplash.com/photo-1477587458883-47145ed6979c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Sunset Canoe on Backwaters", img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
];

const CHIPS_WATER: ActivityChip[] = [
  { label: "Backwater Houseboat Cruise",  img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Sunset Canoe on Backwaters",  img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Varkala Cliff Beach",         img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Kovalam Beach & Surfing",    img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Chinese Fishing Nets",        img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Sea Kayaking — Lakshadweep", img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
];

const CHIPS_FOOD: ActivityChip[] = [
  { label: "Kerala Sadya Feast",          img: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Spice Plantation Tour",       img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Kerala Fish Curry Cooking",  img: "https://images.unsplash.com/photo-1574484284002-952d92456975?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Toddy Shop Experience",      img: "https://images.unsplash.com/photo-1625980319455-985e5442c5ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Street Food in Thrissur",   img: "https://images.unsplash.com/photo-1567337710282-00832b415979?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Appam & Stew Breakfast",    img: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
];

const CHIPS_ADVENTURE: ActivityChip[] = [
  { label: "Periyar Tiger Reserve",       img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Elephant Sanctuary Visit",   img: "https://images.unsplash.com/photo-1549366021-9f761d450615?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Trekking in Munnar Hills",   img: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Bamboo Rafting — Periyar",   img: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Paragliding — Vagamon",      img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Athirappilly Waterfall Trek",img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
];

const CHIPS_CULTURE: ActivityChip[] = [
  { label: "Kathakali Dance Show",        img: "https://images.unsplash.com/photo-1617040941567-b1bfc1a9f37c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Fort Kochi Heritage Walk",    img: "https://images.unsplash.com/photo-1477587458883-47145ed6979c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Padmanabhapuram Palace",     img: "https://images.unsplash.com/photo-1599661046289-e31897846e41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Thrissur Pooram Festival",   img: "https://images.unsplash.com/photo-1617040941567-b1bfc1a9f37c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Mattancherry Dutch Palace",  img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Kalaripayattu Martial Art", img: "https://images.unsplash.com/photo-1604537529428-15bcbeecfe4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
];

const CHIPS_RELAX: ActivityChip[] = [
  { label: "Ayurvedic Spa & Wellness",   img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Tea Garden Walks",            img: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Sunset at Varkala Cliffs",   img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Houseboat Stargazing",       img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Yoga at Kovalam Beach",      img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { label: "Silent Valley Nature Walk",  img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
];

const CHIP_CONTEXTS: Record<string, { chips: ActivityChip[]; label: string }> = {
  default:   { chips: CHIPS_DEFAULT,   label: "Popular Kerala experiences" },
  water:     { chips: CHIPS_WATER,     label: "Water & coastal activities" },
  food:      { chips: CHIPS_FOOD,      label: "Food & culinary experiences" },
  adventure: { chips: CHIPS_ADVENTURE, label: "Adventure & wildlife" },
  culture:   { chips: CHIPS_CULTURE,   label: "Culture & heritage" },
  relax:     { chips: CHIPS_RELAX,     label: "Relaxing experiences" },
};

function detectContext(q: string) {
  const s = q.toLowerCase();
  if (/beach|ocean|water|backwater|lake|river|boat|houseboat|swim|sea|canal/.test(s)) return "water";
  if (/food|eat|restaurant|cuisine|sadya|spice|toddy|appam|fish|curry|cook/.test(s)) return "food";
  if (/adventure|hike|hiking|trek|tiger|elephant|safari|wild|jungle|periyar|forest/.test(s)) return "adventure";
  if (/culture|heritage|history|kathakali|palace|temple|festival|dance|art|kochi/.test(s)) return "culture";
  if (/relax|chill|ayurved|spa|calm|peace|quiet|yoga|unwind|rest|sunset/.test(s)) return "relax";
  return "default";
}

const PROCESSING_TEXTS = [
  "Searching for flights to Kochi...",
  "Finding the best stays in Kerala...",
  "Discovering hidden gems & backwaters...",
  "Checking local restaurant picks...",
  "Crafting your perfect Kerala itinerary...",
];

// ── Kerala logistics (5-day trip) ──────────────────────────────────────────
const LOGISTICS = [
  {
    day: 1, date: "Mon, Nov 17",
    transport: { type: "flight" as const, route: "DEL → COK", carrier: "IndiGo · 6E 361", time: "6:00 AM → 9:45 AM", duration: "3h 45m", price: 4850 },
    hotel: {
      name: "Windermere Estate", sub: "Munnar, Idukki, Kerala", note: "Check-in · 3 nights", price: "₹8,500 / night", priceNum: 8500, newStay: true,
      img: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
      alts: [
        { name: "Spice Tree Munnar", sub: "Idukki, Kerala", price: "₹6,200 / night", img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200" },
        { name: "Blanket Hotel & Spa", sub: "Munnar Town, Kerala", price: "₹4,800 / night", img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200" },
      ],
    },
  },
  {
    day: 2, date: "Tue, Nov 18",
    transport: { type: "car" as const, route: "Rental Car · Munnar Sightseeing", carrier: "Zoomcar · Innova Crysta", time: "Pickup 8:00 AM", duration: "All day", price: 2200 },
    hotel: {
      name: "Windermere Estate", sub: "Munnar, Idukki, Kerala", note: "Continuing stay · Night 2 of 3", price: "₹8,500 / night", priceNum: 8500, newStay: false,
      img: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
      alts: [
        { name: "Spice Tree Munnar", sub: "Idukki, Kerala", price: "₹6,200 / night", img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200" },
        { name: "Blanket Hotel & Spa", sub: "Munnar Town, Kerala", price: "₹4,800 / night", img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200" },
      ],
    },
  },
  {
    day: 3, date: "Wed, Nov 19",
    transport: { type: "car" as const, route: "Drive · Munnar → Alleppey", carrier: "Zoomcar · Innova Crysta", time: "9:00 AM → 2:30 PM", duration: "~5.5 hrs", price: 1800 },
    hotel: {
      name: "Kerala Rice Boat", sub: "Punnamada Lake, Alleppey", note: "Check-in · 1 night houseboat", price: "₹22,000 / night", priceNum: 22000, newStay: true,
      img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
      alts: [
        { name: "Punnamada Resort", sub: "Alleppey, Kerala", price: "₹9,500 / night", img: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200" },
        { name: "Lake Palace Resort", sub: "Alleppey Backwaters", price: "₹7,200 / night", img: "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200" },
      ],
    },
  },
  {
    day: 4, date: "Thu, Nov 20",
    transport: { type: "car" as const, route: "Drive · Alleppey → Varkala", carrier: "Cab · Innova", time: "10:00 AM → 12:30 PM", duration: "~2.5 hrs", price: 1400 },
    hotel: {
      name: "Taj Green Cove Resort", sub: "Kovalam, Thiruvananthapuram", note: "Check-in · 1 night", price: "₹14,000 / night", priceNum: 14000, newStay: true,
      img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
      alts: [
        { name: "Varkala Sea Face", sub: "Varkala Cliff, Kerala", price: "₹5,500 / night", img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200" },
        { name: "Leela Kovalam", sub: "Kovalam Beach, Kerala", price: "₹18,500 / night", img: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200" },
      ],
    },
  },
  {
    day: 5, date: "Fri, Nov 21",
    transport: { type: "flight" as const, route: "TRV → Home", carrier: "Air India · AI 527", time: "4:30 PM → 8:10 PM", duration: "3h 40m", price: 5200 },
    hotel: {
      name: "Taj Green Cove Resort", sub: "Kovalam, Thiruvananthapuram", note: "Check-out by 12:00 PM", price: "", priceNum: 0, newStay: false,
      img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
      alts: [],
    },
  },
];

// ── Kerala itinerary (5 days) ──────────────────────────────────────────────
const DAY_IMAGES = [
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600", // Fort Kochi arrival
  "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600", // Munnar tea gardens
  "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600", // Alleppey backwaters
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600", // Varkala cliff beach
  "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600", // Kovalam / departure
];

const ITINERARY_DAYS = [
  { day: 1, date: "Monday, Nov 17", tagline: "Arrival · Munnar Hills", activities: [
    { time: "9:45 AM",  name: "Arrive at Cochin International Airport",   kind: "transport" },
    { time: "11:30 AM", name: "Drive to Munnar via Kaladi",               kind: "transport" },
    { time: "2:30 PM",  name: "Check-in — Windermere Estate, Munnar",    kind: "hotel" },
    { time: "4:00 PM",  name: "Pothamedu Viewpoint & Sunset Walk",       kind: "sight" },
    { time: "7:00 PM",  name: "Kerala Sadya Dinner at estate",            kind: "food" },
  ]},
  { day: 2, date: "Tuesday, Nov 18", tagline: "Tea Gardens · Eravikulam", activities: [
    { time: "6:30 AM",  name: "Sunrise at Top Station — Munnar Peaks",   kind: "sight" },
    { time: "9:00 AM",  name: "Breakfast at Rapsy Restaurant",            kind: "food" },
    { time: "10:30 AM", name: "Eravikulam National Park — Nilgiri Tahr", kind: "activity" },
    { time: "1:30 PM",  name: "Tea Museum & Tasting — KDHP Estate",      kind: "sight" },
    { time: "4:00 PM",  name: "Ayurvedic Massage at Windermere Spa",     kind: "activity" },
    { time: "7:30 PM",  name: "Candle-lit dinner at estate",              kind: "food" },
  ]},
  { day: 3, date: "Wednesday, Nov 19", tagline: "Alleppey · Houseboat", activities: [
    { time: "8:00 AM",  name: "Check-out — Windermere Estate",           kind: "hotel" },
    { time: "9:00 AM",  name: "Drive Munnar → Alleppey via Kottayam",    kind: "transport" },
    { time: "3:00 PM",  name: "Check-in — Kerala Rice Boat Houseboat",   kind: "hotel" },
    { time: "4:30 PM",  name: "Backwater Cruise — Vembanad Lake",        kind: "activity" },
    { time: "7:00 PM",  name: "Fresh-catch fish dinner on deck",         kind: "food" },
    { time: "9:00 PM",  name: "Stargazing on houseboat rooftop",         kind: "activity" },
  ]},
  { day: 4, date: "Thursday, Nov 20", tagline: "Varkala · Cliff Beach", activities: [
    { time: "6:30 AM",  name: "Sunrise canoe through narrow canals",      kind: "activity" },
    { time: "8:30 AM",  name: "Appam & stew breakfast on board",         kind: "food" },
    { time: "10:30 AM", name: "Drive to Varkala Cliff Beach",            kind: "transport" },
    { time: "1:00 PM",  name: "Lunch at Café del Mar, Varkala Cliff",   kind: "food" },
    { time: "3:00 PM",  name: "Check-in — Taj Green Cove Resort",        kind: "hotel" },
    { time: "5:30 PM",  name: "Cliffside sunset watch at Varkala",       kind: "sight" },
  ]},
  { day: 5, date: "Friday, Nov 21", tagline: "Kovalam · Departure", activities: [
    { time: "7:00 AM",  name: "Yoga session at Kovalam beach",            kind: "activity" },
    { time: "9:00 AM",  name: "Seafood breakfast at resort",              kind: "food" },
    { time: "11:00 AM", name: "Fort Kochi — Chinese Fishing Nets",       kind: "sight" },
    { time: "12:00 PM", name: "Check-out — Taj Green Cove Resort",       kind: "hotel" },
    { time: "4:30 PM",  name: "Depart — Thiruvananthapuram Airport",     kind: "transport" },
  ]},
];

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ── Person icons ───────────────────────────────────────────────────────────
function SoloIcon({ a }: { a: boolean }) {
  const c = a ? C.coral : C.sub;
  return <svg width="28" height="30" viewBox="0 0 28 30" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round"><circle cx="14" cy="9" r="5.5" /><path d="M3 29c0-6.075 4.925-11 11-11s11 4.925 11 11" /></svg>;
}
function PartnerIcon({ a }: { a: boolean }) {
  const c = a ? C.coral : C.sub;
  return <svg width="36" height="30" viewBox="0 0 36 30" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="9" r="4.5" /><path d="M1 29c0-5 4.5-9.5 10-9.5" /><circle cx="25" cy="9" r="4.5" /><path d="M35 29c0-5-4.5-9.5-10-9.5" /></svg>;
}
function FriendsIcon({ a }: { a: boolean }) {
  const c = a ? C.coral : C.sub;
  return <svg width="42" height="30" viewBox="0 0 42 30" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round"><circle cx="9" cy="8.5" r="4" /><path d="M1 29c0-4.5 3.5-8 8-8" /><circle cx="21" cy="8.5" r="4" /><path d="M13 29c0-4.5 3.5-8 8-8s8 3.5 8 8" /><circle cx="33" cy="8.5" r="4" /><path d="M41 29c0-4.5-3.5-8-8-8" /></svg>;
}
function FamilyIcon({ a }: { a: boolean }) {
  const c = a ? C.coral : C.sub;
  return <svg width="42" height="30" viewBox="0 0 42 30" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="8" r="4.5" /><path d="M1 29c0-5 4.5-9.5 10-9.5" /><circle cx="31" cy="8" r="4.5" /><path d="M41 29c0-5-4.5-9.5-10-9.5" /><path d="M11 29c0-5 4.5-9.5 10-9.5s10 4.5 10 9.5" /><circle cx="21" cy="21" r="2.8" /></svg>;
}

function CleartripLogo({ className }: { className?: string }) {
  return <img src={cleartripLogo} alt="Cleartrip" className={className} />;
}

function AiBadge() {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      <div className="w-[7px] h-[7px] rounded-full" style={{ background: C.teal }} />
      <span className="font-medium" style={{ color: C.teal, fontSize: T.micro }}>This trip is powered by AI</span>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-7 pt-[14px] pb-1 flex-shrink-0" style={{ color: C.ink }}>
      <span className="text-[15px] font-semibold tracking-tight">9:41</span>
      <div className="flex items-center gap-[6px]">
        <svg width="17" height="12" viewBox="0 0 17 12" fill={C.ink}>
          <rect x="0" y="4.5" width="3" height="7.5" rx="0.8" />
          <rect x="4.5" y="3" width="3" height="9" rx="0.8" />
          <rect x="9" y="1.5" width="3" height="10.5" rx="0.8" />
          <rect x="13.5" y="0" width="3" height="12" rx="0.8" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round">
          <circle cx="8" cy="10.5" r="1.4" fill={C.ink} stroke="none" />
          <path d="M3.5 6.5C5 5.1 6.4 4.2 8 4.2s3 .9 4.5 2.3" />
          <path d="M1 4C3 2.1 5.3.6 8 .6s5 1.5 7 3.4" />
        </svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3.5" stroke={C.ink} strokeOpacity="0.35" />
          <rect x="2" y="2" width="18" height="8" rx="2" fill={C.ink} />
          <path d="M24 4v4a2 2 0 000-4z" fill={C.ink} fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  );
}

function BottomNav({ active }: { active: string }) {
  const tabs = [
    { id: "home",    icon: <Home size={22} />,   label: "Home" },
    { id: "search",  icon: <Search size={22} />,  label: "Search" },
    { id: "trips",   icon: <MapPin size={22} />,  label: "Trips" },
    { id: "review",  icon: <Star size={22} />,    label: "Review" },
    { id: "account", icon: <User size={22} />,    label: "Account" },
  ];
  return (
    <div className="flex items-center justify-around px-1 pt-2 pb-1 flex-shrink-0" style={{ borderTop: `1px solid ${C.hair}` }}>
      {tabs.map(tab => (
        <button key={tab.id} className="flex flex-col items-center gap-[2px] px-3 py-1"
          style={{ color: tab.id === active ? C.ink : C.sub }}>
          {tab.icon}
          <span className="font-medium" style={{ fontSize: T.micro }}>{tab.label}</span>
          {tab.id === active && <div className="w-1 h-1 rounded-full" style={{ background: C.ink }} />}
        </button>
      ))}
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────
function MonthCalendar({ startDate, endDate, onChange }: {
  startDate: Date | null; endDate: Date | null;
  onChange: (s: Date | null, e: Date | null) => void;
}) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const cells: (Date | null)[] = Array.from({ length: 42 }, (_, i) => {
    const d = i - firstDay + 1;
    return (d >= 1 && d <= daysInMonth) ? new Date(viewYear, viewMonth, d) : null;
  });
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const handleClick = (date: Date) => {
    if (date < todayMid) return;
    if (!startDate || endDate) { onChange(date, null); return; }
    if (date <= startDate) { onChange(date, null); return; }
    onChange(startDate, date);
  };
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:opacity-70 transition-opacity" style={{ background: C.card }}>
          <ChevronLeft size={16} color={C.ink} />
        </button>
        <span className="text-[13.5px] font-semibold" style={{ color: C.ink }}>{MONTH_FULL[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:opacity-70 transition-opacity" style={{ background: C.card }}>
          <ChevronRight size={16} color={C.ink} />
        </button>
      </div>
      <div className="grid grid-cols-7">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} className="text-center font-medium pb-2" style={{ color: C.sub, fontSize: T.micro }}>{d}</div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="h-9" />;
          const isS = !!(startDate && same(date, startDate));
          const isE = !!(endDate && same(date, endDate));
          const inRng = !!(startDate && endDate && date > startDate && date < endDate);
          const isPast = date < todayMid;
          return (
            <div key={i} className="h-9 flex items-center justify-center"
              style={inRng ? { background: "#EFEFEF" } : {}}>
              <button disabled={isPast} onClick={() => handleClick(date)}
                className="w-9 h-9 rounded-full flex items-center justify-center font-medium transition-colors"
                style={{
                  fontSize: T.body,
                  background: (isS || isE) ? C.ink : "transparent",
                  color: isPast ? C.hair : (isS || isE) ? "#fff" : inRng ? C.ink : C.ink,
                  cursor: isPast ? "default" : "pointer",
                }}>
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-center mt-3 min-h-[16px]" style={{ color: C.sub, fontSize: T.label }}>
        {startDate && !endDate && `${fmt(startDate)} → select end date`}
        {startDate && endDate && `${fmt(startDate)} → ${fmt(endDate)}`}
      </p>
    </div>
  );
}

// ── Flexible dates ─────────────────────────────────────────────────────────
function FlexibleDates({ days, setDays, months, toggleMonth }: {
  days: number | null; setDays: (v: number) => void;
  months: number[]; toggleMonth: (m: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentMonth = new Date().getMonth();
  const MIN = 1; const MAX = 30;
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = currentMonth * (96 + 8);
  }, []);
  const decrement = () => { if (!days || days <= MIN) return; setDays(days - 1); };
  const increment = () => { if (!days) { setDays(MIN); return; } if (days >= MAX) return; setDays(days + 1); };
  return (
    <div className="space-y-5 mt-3">
      <div>
        <p className="font-semibold uppercase tracking-wider mb-3" style={{ color: C.sub, fontSize: T.caption }}>How many days?</p>
        <div className="flex items-center justify-between px-5 py-4 rounded-2xl"
          style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: C.cardShadow }}>
          <button onClick={decrement} disabled={!days || days <= MIN}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ border: `2px solid ${days && days > MIN ? C.ink : C.cardBorder}`, color: days && days > MIN ? C.ink : C.cardBorder }}>
            <Minus size={17} strokeWidth={2.5} />
          </button>
          <div className="flex flex-col items-center min-w-[72px]">
            <AnimatePresence mode="wait">
              <motion.span key={days ?? "empty"}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="font-bold leading-none tabular-nums" style={{ color: C.ink, fontSize: "28px" }}>
                {days ?? "—"}
              </motion.span>
            </AnimatePresence>
            <span className="mt-1 h-4" style={{ color: C.sub, fontSize: T.label }}>{days ? (days === 1 ? "day" : "days") : ""}</span>
          </div>
          <button onClick={increment} disabled={!!days && days >= MAX}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ border: `2px solid ${!days || days < MAX ? C.ink : C.cardBorder}`, color: !days || days < MAX ? C.ink : C.cardBorder }}>
            <Plus size={17} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <div>
        <p className="font-semibold uppercase tracking-wider mb-3" style={{ color: C.sub, fontSize: T.caption }}>Preferred month</p>
        <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
          {MONTH_SHORT.map((m, i) => {
            const isPast = i < currentMonth;
            const sel = months.includes(i);
            return (
              <button key={m} onClick={() => { if (!isPast) toggleMonth(i); }}
                className="flex-shrink-0 w-24 py-3.5 rounded-2xl text-[13.5px] font-semibold transition-all"
                style={{
                  border: `2px solid ${isPast ? C.hair : sel ? C.ink : C.hair}`,
                  background: isPast ? "transparent" : sel ? C.ink : "transparent",
                  color: isPast ? C.hair : sel ? "#fff" : C.ink,
                  transform: sel ? "scale(1.03)" : "scale(1)",
                }}>
                <span className="block">{m}</span>
                {!isPast && <span className="block font-normal mt-0.5 opacity-60" style={{ fontSize: T.micro }}>
                  {i >= currentMonth ? new Date().getFullYear() : new Date().getFullYear() + 1}
                </span>}
              </button>
            );
          })}
        </div>
        <p className="text-right mt-1.5 pr-1" style={{ color: C.sub, fontSize: T.micro }}>scroll for more →</p>
      </div>
    </div>
  );
}

// ── Video link sheet ───────────────────────────────────────────────────────
// Extract YouTube video ID from various URL formats
function getYtVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

function VideoLinkSheet({ onClose, onMakeTrip }: { onClose: () => void; onMakeTrip: (url: string) => void }) {
  const [url, setUrl] = useState("");
  const [uploadStage, setUploadStage] = useState<"idle" | "uploading" | "done">("idle");
  const [uploadPct, setUploadPct] = useState(0);

  const videoId = getYtVideoId(url);
  // Use a beautiful Kerala travel video thumbnail as the simulated preview
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";

  const handlePaste = (val: string) => {
    setUrl(val);
    if (!val) { setUploadStage("idle"); setUploadPct(0); return; }
    setUploadStage("uploading");
    setUploadPct(0);
    let pct = 0;
    const id = setInterval(() => {
      pct += Math.random() * 18 + 6;
      if (pct >= 100) { pct = 100; clearInterval(id); setUploadStage("done"); }
      setUploadPct(Math.min(pct, 100));
    }, 200);
  };

  const isYt = url.includes("youtube") || url.includes("youtu.be");

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 z-20" style={{ background: `${C.ink}66` }}
        onClick={onClose} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="absolute inset-x-0 bottom-0 z-30 rounded-t-[28px] flex flex-col shadow-2xl"
        style={{ background: C.ground }}>

        <div className="flex justify-center pt-3 pb-0">
          <div className="w-9 h-[5px] rounded-full" style={{ background: C.hair }} />
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-1.5">
            <div className="w-[7px] h-[7px] rounded-full" style={{ background: C.teal }} />
            <span className="text-[12px] font-medium" style={{ color: C.teal }}>Powered by AI</span>
          </div>
          <button onClick={onClose}><X size={20} strokeWidth={2} color={C.ink} /></button>
        </div>

        <div className="px-5 pb-8">
          <div className="mb-1 flex items-center gap-2">
            <Video size={18} color={C.coral} />
            <h2 className="font-semibold" style={{ color: C.ink, fontSize: T.primaryValue }}>Plan a trip with a video</h2>
          </div>
          <p className="mb-4" style={{ color: C.sub, fontSize: T.body }}>
            Paste a YouTube travel video link and we'll extract destinations, itinerary ideas, pricing and more.
          </p>

          {/* Video thumbnail preview */}
          <AnimatePresence>
            {uploadStage !== "idle" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 160, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl overflow-hidden mb-3 relative"
                style={{ border: `1px solid ${C.cardBorder}` }}>
                <img src={thumbnailUrl} alt="Video preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {/* Play icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.55)" }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="white">
                      <polygon points="5,3 15,9 5,15" />
                    </svg>
                  </div>
                </div>
                {/* Progress overlay while uploading */}
                {uploadStage === "uploading" && (
                  <div className="absolute bottom-0 inset-x-0 px-3 pb-2.5 pt-6"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.3)" }}>
                        <motion.div className="h-full rounded-full bg-white"
                          animate={{ width: `${uploadPct}%` }} transition={{ duration: 0.18 }} />
                      </div>
                      <span className="text-white" style={{ fontSize: T.micro }}>{Math.round(uploadPct)}%</span>
                    </div>
                  </div>
                )}
                {/* Done badge */}
                {uploadStage === "done" && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="absolute bottom-2.5 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(0,0,0,0.6)" }}>
                    <CheckCircle2 size={12} color="#4ADE80" />
                    <span className="text-white" style={{ fontSize: T.micro }}>
                      {isYt ? "YouTube video ready" : "Link ready"}
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* URL input area */}
          <div className="rounded-2xl overflow-hidden mb-4"
            style={{ border: `1.5px solid ${url ? C.ink : C.hair}`, background: C.cardBg }}>
            <div className="flex items-center gap-2.5 px-3.5 py-3">
              <Link size={15} color={url ? C.ink : C.sub} className="flex-shrink-0" />
              <input
                type="url"
                placeholder="Paste YouTube URL here…"
                value={url}
                onChange={e => handlePaste(e.target.value)}
                className="flex-1 outline-none bg-transparent font-normal"
                style={{ fontSize: T.body, color: C.ink, caretColor: C.ink }}
              />
              {url && (
                <button onClick={() => handlePaste("")} className="flex-shrink-0">
                  <X size={14} color={C.sub} />
                </button>
              )}
            </div>
          </div>

          <button
            disabled={uploadStage !== "done"}
            onClick={() => onMakeTrip(url)}
            className="w-full h-[50px] rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:opacity-85"
            style={{ fontSize: T.sectionValue, background: uploadStage === "done" ? C.coral : C.hair, color: uploadStage === "done" ? "#fff" : C.sub }}>
            <Sparkles size={16} />
            Make the trip
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ── Itinerary v2 (after AI rewrite) ───────────────────────────────────────
const ITINERARY_DAYS_V2 = [
  ...ITINERARY_DAYS.slice(0, 2),
  {
    ...ITINERARY_DAYS[2],
    activities: [
      ITINERARY_DAYS[2].activities[0],
      ITINERARY_DAYS[2].activities[1],
      { time: "12:00 PM", name: "Kerala Cooking Class — Spice, Coconut & Curry", kind: "activity", isNew: true },
      { ...ITINERARY_DAYS[2].activities[2], time: "3:30 PM" },
      { ...ITINERARY_DAYS[2].activities[3], time: "5:00 PM" },
      { ...ITINERARY_DAYS[2].activities[4] },
    ],
  },
  ...ITINERARY_DAYS.slice(3),
];

const REWRITE_STEPS = [
  "Reading your request…",
  "Analysing current itinerary structure…",
  "Searching for cooking experiences in Alleppey…",
  "Adjusting Day 3 schedule to fit new activity…",
  "Rechecking timing and travel gaps…",
  "Finalising your updated itinerary…",
];

// ── Video processing screen ────────────────────────────────────────────────
const VIDEO_REASONING_STEPS = [
  { text: "Reading video transcript and captions…" },
  { text: "Identifying destinations mentioned by the creator…" },
  { text: "Places found: Munnar · Alleppey · Kovalam" },
  { text: "Extracting travel tips and hidden gems…" },
  { text: "Analysing pricing, entry tickets & transport costs…" },
  { text: "Checking hotel and stay recommendations…" },
  { text: "Estimating trip budget from video context…" },
  { text: "Pre-filling your trip details — almost done!" },
];

function VideoProcessingScreen({ onComplete }: { onComplete: () => void }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  // Step delays in ms — varied cadence so it feels organic
  const STEP_DELAYS = [900, 950, 1100, 850, 1000, 900, 950, 800];

  useEffect(() => {
    if (visibleCount < VIDEO_REASONING_STEPS.length) {
      const delay = STEP_DELAYS[visibleCount] ?? 900;
      const id = setTimeout(() => setVisibleCount(v => v + 1), delay);
      return () => clearTimeout(id);
    } else if (!showComplete) {
      // All steps done — show the completion popup after a brief pause
      const id = setTimeout(() => setShowComplete(true), 400);
      return () => clearTimeout(id);
    }
  }, [visibleCount, showComplete]);

  // After showing the popup for 4s, proceed
  useEffect(() => {
    if (!showComplete) return;
    const id = setTimeout(onComplete, 4000);
    return () => clearTimeout(id);
  }, [showComplete, onComplete]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.35 } }}
      className="absolute inset-0 flex flex-col z-40 px-6"
      style={{ background: C.ground }}>

      {/* Top — icon + title */}
      <div className="pt-14 mb-8 flex flex-col items-center">
        <motion.div animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="w-14 h-14 rounded-full mb-5 flex items-center justify-center"
          style={{ background: C.coralSoft }}>
          <Video size={24} color={C.coral} />
        </motion.div>
        <p className="font-medium text-center" style={{ color: C.ink, fontSize: T.sectionValue }}>Analysing your video</p>
        <p style={{ color: C.sub, fontSize: T.caption, marginTop: 4 }}>AI is reading the trip content…</p>
      </div>

      {/* Reasoning steps */}
      <div className="flex-1 space-y-3">
        <AnimatePresence>
          {VIDEO_REASONING_STEPS.slice(0, visibleCount).map((step, i) => {
            const isPlaces = step.text.startsWith("Places found");
            const isActive = i === visibleCount - 1 && visibleCount < VIDEO_REASONING_STEPS.length;
            const isDone = i < visibleCount - 1 || visibleCount === VIDEO_REASONING_STEPS.length;
            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex items-start gap-2.5">
                <motion.div className="flex-shrink-0 mt-[1px]"
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 20 }}>
                  {isDone
                    ? <CheckCircle2 size={14} color={C.good} />
                    : <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.9, repeat: Infinity }}
                        className="w-3.5 h-3.5 rounded-full" style={{ background: C.sub }} />
                  }
                </motion.div>
                <span className="relative overflow-hidden leading-snug"
                  style={{ color: isPlaces ? C.ink : "#AAAAAA", fontSize: "12px", fontWeight: isPlaces ? 500 : 400 }}>
                  {isActive && (
                    <motion.span className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)", backgroundSize: "200% 100%" }}
                      animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                      transition={{ duration: 1.4, ease: "linear", repeat: Infinity }} />
                  )}
                  {step.text}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Completion overlay — darkens the existing screen in place */}
      <AnimatePresence>
        {showComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-50"
            style={{ background: "rgba(22,19,15,0.72)" }}>

            {/* Tick circle + glow */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 18, stiffness: 280, delay: 0.08 }}
              className="relative flex items-center justify-center mb-5">
              {/* Breathing glow */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.65, 0.4] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-28 h-28 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(74,222,128,0.45) 0%, transparent 70%)" }} />
              {/* Circle */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.12 }}
                className="w-16 h-16 rounded-full flex items-center justify-center relative z-10"
                style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)", boxShadow: "0 0 28px rgba(34,197,94,0.5)" }}>
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                  <motion.path
                    d="M7 15.5L12.5 21L23 10"
                    stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }} />
                </svg>
              </motion.div>
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.28, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="text-center px-10">
              <p className="font-semibold mb-1.5" style={{ color: "#FFFFFF", fontSize: T.primaryValue }}>
                Plan extracted from the video
              </p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: T.body }}>
                Now add your preferences
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Home screen ────────────────────────────────────────────────────────────
function HomeScreen({ onStart, onVideoTrip }: { onStart: () => void; onVideoTrip: () => void }) {
  return (
    <div className="flex flex-col h-full" style={{ background: C.ground }}>
      <div className="flex-1 px-5 pt-5 pb-4 overflow-y-auto">
        <CleartripLogo className="h-7 mb-6 object-contain" />
        <h1 className="font-bold leading-tight mb-3" style={{ color: C.ink, fontSize: T.screenTitle }}>Get to know Trips</h1>
        <p className="leading-relaxed mb-7" style={{ color: C.sub, fontSize: T.body }}>
          Two ways to plan your trip — use AI or search on your own. Over 8 million spots, one billion traveller reviews.
        </p>
        <div className="space-y-[18px] mb-9">
          {[
            { icon: <Sparkles size={17} />, text: "Get personalised recs with AI",         teal: true  },
            { icon: <Heart size={17} />,    text: "Save hotels, restaurants, and more",     teal: false },
            { icon: <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="1,3 6,1 11,3 16,1 16,14 11,16 6,14 1,16"/><line x1="6" y1="1" x2="6" y2="14"/><line x1="11" y1="3" x2="11" y2="16"/></svg>, text: "See your saves on your custom map",      teal: false },
            { icon: <Users size={17} />,    text: "Share and collab with your travel buds", teal: false },
          ].map(({ icon, text, teal }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="flex-shrink-0" style={{ color: teal ? C.teal : C.coral }}>{icon}</div>
              <span className="font-medium" style={{ color: C.ink, fontSize: T.body }}>{text}</span>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <button onClick={onStart}
            className="w-full h-[50px] rounded-xl font-semibold flex items-center justify-center gap-2 active:opacity-85 transition-opacity"
            style={{ fontSize: T.sectionValue, background: C.coral, color: "#fff" }}>
            <Plus size={18} strokeWidth={2.5} />
            Create a Trip
          </button>
          <button onClick={onVideoTrip}
            className="w-full h-[50px] rounded-xl font-semibold flex items-center justify-center gap-2 active:opacity-85 transition-opacity"
            style={{ fontSize: T.sectionValue, background: C.coralSoft, color: C.coral }}>
            <Video size={16} />
            Plan a trip with a video
          </button>
        </div>
      </div>
      <BottomNav active="trips" />
    </div>
  );
}

// ── Location + Dates step ──────────────────────────────────────────────────
function LocationDatesContent({
  searchQuery, setSearchQuery, destination, setDestination, suggestions,
  dateMode, setDateMode, startDate, endDate, onDatesChange,
  flexDays, setFlexDays, flexMonths, toggleFlexMonth,
}: {
  searchQuery: string; setSearchQuery: (v: string) => void;
  destination: string; setDestination: (v: string) => void;
  suggestions: typeof DEFAULT_SUGGESTIONS;
  dateMode: DateMode; setDateMode: (v: DateMode) => void;
  startDate: Date | null; endDate: Date | null;
  onDatesChange: (s: Date | null, e: Date | null) => void;
  flexDays: number | null; setFlexDays: (v: number) => void;
  flexMonths: number[]; toggleFlexMonth: (m: number) => void;
}) {
  const [showSugg, setShowSugg] = useState(false);
  const selectedSuggestion = destination ? suggestions.find(s => s.name === destination) : null;

  return (
    <div>
      <h2 className="font-bold leading-snug mb-1" style={{ color: C.ink, fontSize: T.screenTitle }}>Plan your trip</h2>
      <p className="mb-5 leading-relaxed" style={{ color: C.sub, fontSize: T.body }}>Tell us where and when — we'll handle the rest.</p>

      {/* Where */}
      <div className="mb-5">
        <div className="flex items-center gap-1 mb-2">
          <MapPin size={12} color={C.sub} />
          <span className="font-semibold uppercase tracking-wide" style={{ color: C.sub, fontSize: T.label }}>Where?</span>
        </div>

        {/* Input box — shows photo thumbnail when a destination is selected */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${destination ? C.ink : C.hair}`, background: C.card }}>
          {/* Selected destination banner */}
          <AnimatePresence>
            {destination && selectedSuggestion?.img && (
              <motion.div
                key="dest-photo"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 88, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden">
                <img
                  src={selectedSuggestion.img.replace("w=120", "w=600")}
                  alt={destination}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                  <div>
                    <div className="text-white font-bold leading-none drop-shadow" style={{ fontSize: T.sectionValue }}>{destination}</div>
                    {selectedSuggestion.sub && (
                      <div className="text-white/75 mt-0.5 leading-none" style={{ fontSize: T.micro }}>{selectedSuggestion.sub}</div>
                    )}
                  </div>
                  <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search row */}
          <div className="flex items-center gap-2 px-3 py-3">
            <Search size={15} color={destination ? C.ink : C.sub} className="flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              placeholder="Search destination..."
              onChange={e => { setSearchQuery(e.target.value); if (!e.target.value) setDestination(""); setShowSugg(true); }}
              onFocus={() => setShowSugg(true)}
              className="flex-1 outline-none bg-transparent font-medium"
              style={{ fontSize: T.body, color: C.ink, caretColor: C.ink }}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setDestination(""); }}>
                <X size={14} color={C.sub} />
              </button>
            )}
          </div>
        </div>

        {showSugg && !destination && (
          <div className="mt-2 space-y-0.5">
            {suggestions.map(s => (
              <button key={s.name} onClick={() => { setDestination(s.name); setSearchQuery(s.name); setShowSugg(false); }}
                className="w-full flex items-center gap-3 p-2 rounded-xl transition-colors text-left"
                style={{ background: destination === s.name ? "#EFEFEF" : "transparent" }}>
                <div className="w-[46px] h-[46px] rounded-xl overflow-hidden flex-shrink-0" style={{ background: C.hair }}>
                  {s.img ? <img src={s.img} alt={s.name} className="w-full h-full object-cover" /> : <MapPin size={16} color={C.sub} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate" style={{ color: C.ink, fontSize: T.sectionValue }}>{s.name}</div>
                  <div className="truncate" style={{ color: C.sub, fontSize: T.label }}>{s.sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showSugg && destination && (
          <div className="mt-2 space-y-0.5">
            {suggestions.filter(s => s.name !== destination).map(s => (
              <button key={s.name} onClick={() => { setDestination(s.name); setSearchQuery(s.name); setShowSugg(false); }}
                className="w-full flex items-center gap-3 p-2 rounded-xl transition-colors text-left">
                <div className="w-[46px] h-[46px] rounded-xl overflow-hidden flex-shrink-0" style={{ background: C.hair }}>
                  {s.img ? <img src={s.img} alt={s.name} className="w-full h-full object-cover" /> : <MapPin size={16} color={C.sub} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate" style={{ color: C.ink, fontSize: T.sectionValue }}>{s.name}</div>
                  <div className="truncate" style={{ color: C.sub, fontSize: T.label }}>{s.sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-5" style={{ borderTop: `1px solid ${C.hair}` }} />

      {/* When */}
      <div>
        <div className="flex items-center gap-1 mb-3">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke={C.sub} strokeWidth="1.3"><rect x="1" y="2" width="11" height="10" rx="2"/><path d="M4 1v2M9 1v2M1 5h11"/></svg>
          <span className="font-semibold uppercase tracking-wide" style={{ color: C.sub, fontSize: T.label }}>When?</span>
        </div>
        <div className="flex gap-2 p-1 rounded-full mb-4" style={{ background: C.card }}>
          {(["fixed","flexible"] as DateMode[]).map(mode => (
            <button key={mode} onClick={() => setDateMode(mode)}
              className="flex-1 py-2 rounded-full font-semibold transition-all"
              style={{ fontSize: T.body, background: dateMode === mode ? "#fff" : "transparent", color: dateMode === mode ? C.ink : C.sub, boxShadow: dateMode === mode ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
              {mode === "fixed" ? "Fixed dates" : "Flexible"}
            </button>
          ))}
        </div>
        {dateMode === "fixed"    && <MonthCalendar startDate={startDate} endDate={endDate} onChange={onDatesChange} />}
        {dateMode === "flexible" && <FlexibleDates days={flexDays} setDays={setFlexDays} months={flexMonths} toggleMonth={toggleFlexMonth} />}
      </div>
    </div>
  );
}

// ── Who step ───────────────────────────────────────────────────────────────
function WhoContent({ groupType, setGroupType, groupCount, setGroupCount, hasChildren, setHasChildren }: {
  groupType: GroupType | null; setGroupType: (v: GroupType) => void;
  groupCount: number | null; setGroupCount: (v: number) => void;
  hasChildren: boolean | null; setHasChildren: (v: boolean) => void;
}) {
  const opts: { id: GroupType; label: string; Icon: React.FC<{a:boolean}> }[] = [
    { id: "solo",    label: "Solo",    Icon: SoloIcon    },
    { id: "partner", label: "Partner", Icon: PartnerIcon },
    { id: "friends", label: "Friends", Icon: FriendsIcon },
    { id: "family",  label: "Family",  Icon: FamilyIcon  },
  ];
  const needsCount = groupType === "friends" || groupType === "family";
  const MIN = 2; const MAX = 20;
  const decrement = () => { if (!groupCount || groupCount <= MIN) return; setGroupCount(groupCount - 1); };
  const increment = () => { if (!groupCount) { setGroupCount(MIN); return; } if (groupCount >= MAX) return; setGroupCount(groupCount + 1); };

  return (
    <div>
      <h2 className="font-bold leading-snug mb-1" style={{ color: C.ink, fontSize: T.screenTitle }}>Who's coming with you?</h2>
      <p className="mb-4" style={{ color: C.sub, fontSize: T.body }}>Choose one.</p>

      {/* 4 compact option tiles in a row */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {opts.map(({ id, label, Icon }) => {
          const active = groupType === id;
          return (
            <button key={id} onClick={() => { setGroupType(id); if (id !== "friends" && id !== "family") setGroupCount(null); }}
              className="flex flex-col items-center justify-center gap-2 py-3.5 px-1 rounded-2xl transition-all"
              style={{ border: `2px solid ${active ? C.ink : C.hair}`, background: active ? "#EFEFEF" : "#fff" }}>
              <Icon a={active} />
              <span className="font-semibold" style={{ color: C.ink, fontSize: T.caption }}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* People count stepper — slides in for friends / family */}
      <AnimatePresence>
        {needsCount && (
          <motion.div
            key="people-count"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}>
            <div className="pt-1">
              <p className="font-semibold uppercase tracking-wider mb-3" style={{ color: C.sub, fontSize: T.caption }}>
                How many people?
              </p>
              <div className="flex items-center justify-between px-5 py-4 rounded-2xl"
                style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: C.cardShadow }}>
                <button onClick={decrement} disabled={!groupCount || groupCount <= MIN}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95"
                  style={{ border: `2px solid ${groupCount && groupCount > MIN ? C.ink : C.cardBorder}`, color: groupCount && groupCount > MIN ? C.ink : C.cardBorder }}>
                  <Minus size={17} strokeWidth={2.5} />
                </button>
                <div className="flex flex-col items-center min-w-[72px]">
                  <AnimatePresence mode="wait">
                    <motion.span key={groupCount ?? "empty"}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="font-bold leading-none tabular-nums" style={{ color: C.ink, fontSize: "28px" }}>
                      {groupCount ?? "—"}
                    </motion.span>
                  </AnimatePresence>
                  <span className="mt-1 h-4" style={{ color: C.sub, fontSize: T.label }}>
                    {groupCount ? "people" : ""}
                  </span>
                </div>
                <button onClick={increment} disabled={!!groupCount && groupCount >= MAX}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95"
                  style={{ border: `2px solid ${!groupCount || groupCount < MAX ? C.ink : C.cardBorder}`, color: !groupCount || groupCount < MAX ? C.ink : C.cardBorder }}>
                  <Plus size={17} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {groupType === "family" && (
          <motion.div
            key="children-question"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}>
            <div className="flex items-center gap-1.5 mb-3">
              <span className="font-semibold" style={{ color: C.ink, fontSize: T.body }}>Travelling with children?</span>
              <Info size={12} color={C.sub} />
            </div>
            <div className="flex gap-3">
              {([true, false] as const).map(val => (
                <button key={String(val)} onClick={() => setHasChildren(val)}
                  className="flex-1 py-2.5 rounded-xl text-[13.5px] font-semibold transition-colors"
                  style={{ border: `2px solid ${hasChildren === val ? C.coral : C.hair}`, background: hasChildren === val ? C.coral : "transparent", color: hasChildren === val ? "#fff" : C.ink }}>
                  {val ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Budget step ────────────────────────────────────────────────────────────
function BudgetContent({ budget, setBudget, transportMode, setTransportMode }: {
  budget: number; setBudget: (v: number) => void;
  transportMode: TransportMode | null; setTransportMode: (v: TransportMode) => void;
}) {
  const MIN = 5000; const MAX = 300000;

  const formatBudget = (v: number) => {
    if (v >= 100000) return `₹${(v / 100000).toFixed(1).replace(/\.0$/, "")} L`;
    if (v >= 1000)   return `₹${(v / 1000).toFixed(0)}K`;
    return `₹${v}`;
  };

  const budgetLabel = (v: number) => {
    if (v <= 30000)  return { text: "Budget traveller",  color: C.good };
    if (v <= 100000) return { text: "Mid-range",          color: C.warn };
    return                  { text: "Luxury",              color: C.coral };
  };

  const pct = ((budget - MIN) / (MAX - MIN)) * 100;
  const { text: tierText, color: tierColor } = budgetLabel(budget);

  const transports: { id: TransportMode; label: string; sublabel: string; icon: React.ReactNode }[] = [
    {
      id: "train",
      label: "Train",
      sublabel: "Scenic & comfortable",
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="3" width="18" height="17" rx="4" />
          <path d="M5 12h18" />
          <path d="M10 3v9M18 3v9" />
          <circle cx="9.5" cy="23" r="2" />
          <circle cx="18.5" cy="23" r="2" />
          <path d="M7.5 23H5M20.5 23H23M9.5 21l-2-1M18.5 21l2-1" />
        </svg>
      ),
    },
    {
      id: "flight",
      label: "Flight",
      sublabel: "Fast & direct",
      icon: <Plane size={26} strokeWidth={1.6} />,
    },
    {
      id: "both",
      label: "Either",
      sublabel: "Best option for me",
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 10l4-4 4 4M8 6v10" />
          <path d="M24 18l-4 4-4-4M20 22V12" />
          <path d="M12 14h8" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <h2 className="font-bold leading-snug mb-1" style={{ color: C.ink, fontSize: T.screenTitle }}>What's your budget?</h2>
      <p className="mb-6 leading-relaxed" style={{ color: C.sub, fontSize: T.body }}>Set your total trip budget per person.</p>

      {/* Budget display */}
      <div className="rounded-2xl px-5 py-5 mb-2" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: C.cardShadow }}>
        <div className="flex items-end justify-between mb-1">
          <span className="font-bold leading-none tabular-nums" style={{ color: C.ink, fontSize: "28px" }}>
            {formatBudget(budget)}
          </span>
          <span className="font-semibold px-2.5 py-1 rounded-full mb-1"
            style={{ fontSize: T.caption, background: `${tierColor}18`, color: tierColor }}>
            {tierText}
          </span>
        </div>
        <p className="mb-5" style={{ color: C.sub, fontSize: T.label }}>per person · all inclusive</p>

        {/* Custom slider */}
        <div className="relative">
          <style>{`
            .budget-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 5px; border-radius: 9999px; outline: none; cursor: pointer; background: linear-gradient(to right, ${C.coral} ${pct}%, ${C.hair} ${pct}%); }
            .budget-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 50%; background: ${C.coral}; border: 3px solid white; box-shadow: 0 1px 6px rgba(0,0,0,0.18); cursor: pointer; }
            .budget-slider::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: ${C.coral}; border: 3px solid white; box-shadow: 0 1px 6px rgba(0,0,0,0.18); cursor: pointer; }
          `}</style>
          <input
            type="range"
            className="budget-slider"
            min={MIN} max={MAX} step={5000}
            value={budget}
            onChange={e => setBudget(Number(e.target.value))}
          />
          <div className="flex justify-between mt-2">
            <span style={{ color: C.sub, fontSize: T.micro }}>{formatBudget(MIN)}</span>
            <span style={{ color: C.sub, fontSize: T.micro }}>{formatBudget(MAX)}</span>
          </div>
        </div>
      </div>

      <div className="mb-6" />

      {/* Transport mode */}
      <p className="font-semibold uppercase tracking-wider mb-3" style={{ color: C.sub, fontSize: T.caption }}>How do you prefer to travel?</p>
      <div className="grid grid-cols-3 gap-2.5">
        {transports.map(({ id, label, sublabel, icon }) => {
          const active = transportMode === id;
          return (
            <button key={id} onClick={() => setTransportMode(id)}
              className="flex flex-col items-center justify-center gap-2.5 py-4 px-2 rounded-2xl transition-all"
              style={{ border: `2px solid ${active ? C.ink : C.hair}`, background: active ? "#EFEFEF" : "#fff" }}>
              <div style={{ color: active ? C.ink : C.sub }}>{icon}</div>
              <div className="text-center">
                <div className="font-semibold" style={{ color: C.ink, fontSize: T.body }}>{label}</div>
                <div className="mt-0.5 leading-snug" style={{ color: C.sub, fontSize: T.micro }}>{sublabel}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Interests step ─────────────────────────────────────────────────────────
function InterestsContent({ interests, toggleInterest }: {
  interests: string[]; toggleInterest: (v: string) => void;
}) {
  const [chatInput, setChatInput]   = useState("");
  const [contextKey, setContextKey] = useState("default");
  const [activeQuery, setActiveQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { chips, label } = CHIP_CONTEXTS[contextKey];

  const handleSubmit = () => {
    const q = chatInput.trim();
    if (!q) return;
    setContextKey(detectContext(q));
    setActiveQuery(q);
    setChatInput("");
  };
  const clearQuery = () => { setContextKey("default"); setActiveQuery(""); };

  return (
    <div>
      <h2 className="font-bold leading-snug mb-1" style={{ color: C.ink, fontSize: T.screenTitle }}>How do you want to spend your time?</h2>
      <p className="mb-4" style={{ color: C.sub, fontSize: T.body }}>Pick from suggestions or describe what you enjoy.</p>

      {/* Chat input */}
      <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 mb-3" style={{ background: C.card, border: `1px solid ${C.hair}` }}>
        <Sparkles size={14} color={C.teal} className="flex-shrink-0" />
        <input ref={inputRef} type="text" value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder="e.g. backwaters, spice tours, beaches…"
          className="flex-1 text-[13.5px] outline-none bg-transparent"
          style={{ color: C.ink, caretColor: C.coral }}
        />
        <button onClick={handleSubmit} disabled={!chatInput.trim()}
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
          style={{ background: chatInput.trim() ? C.coral : C.hair, color: chatInput.trim() ? "#fff" : C.sub }}>
          <ArrowUp size={14} strokeWidth={2.5} />
        </button>
      </div>

      <AnimatePresence>
        {activeQuery && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }} className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full font-semibold"
              style={{ background: C.coralSoft, color: C.coral, border: `1px solid ${C.hair}`, fontSize: T.caption }}>"{activeQuery}"</span>
            <button onClick={clearQuery} className="flex items-center gap-0.5" style={{ color: C.sub, fontSize: T.micro }}><X size={11} /> Clear</button>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="font-semibold uppercase tracking-wider mb-3" style={{ color: C.sub, fontSize: T.caption }}>{label}</p>

      <AnimatePresence mode="wait">
        <motion.div key={contextKey}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28 }} className="grid grid-cols-2 gap-2.5 pb-2">
          {chips.map((chip, i) => {
            const selected = interests.includes(chip.label);
            return (
              <motion.button key={chip.label}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                onClick={() => toggleInterest(chip.label)}
                className="relative h-[104px] rounded-2xl overflow-hidden text-left transition-all duration-200"
                style={{ outline: selected ? `2.5px solid ${C.ink}` : "2.5px solid transparent", outlineOffset: "2px" }}>
                <img src={chip.img} alt={chip.label} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                {selected && <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.18)" }} />}
                {selected && (
                  <div className="absolute top-2.5 right-2.5 w-[22px] h-[22px] bg-white rounded-full flex items-center justify-center shadow-sm">
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4.5L4 7.5L10 1" stroke={C.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                <span className="absolute bottom-2.5 left-3 right-7 text-white font-semibold leading-snug drop-shadow-sm" style={{ fontSize: T.label }}>{chip.label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Shimmer reasoning text ─────────────────────────────────────────────────
function ShimmerReasoningText({ lines }: { lines: string[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % lines.length), 2200);
    return () => clearInterval(id);
  }, [lines.length]);
  return (
    <div className="h-5 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="text-[13px] font-medium relative"
          style={{ color: "#BBBBBB" }}
        >
          <motion.span
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
            }}
            animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
            transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
          />
          {lines[idx]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ── Processing screen ──────────────────────────────────────────────────────
function ProcessingScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 6500);
    return () => clearTimeout(t);
  }, [onComplete]);

  const keralaImages = [
    "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400",
    "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400",
    "https://images.unsplash.com/photo-1609828913552-f9138ed9e42d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400",
    "https://images.unsplash.com/photo-1661174607003-d9d36388c916?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400",
    "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400",
    "https://images.unsplash.com/photo-1677475455506-1e429162f44f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400",
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.4 } }}
      className="absolute inset-0 flex flex-col items-center justify-between z-40 px-8"
      style={{ background: C.ground }}>
      
      <div className="flex-1 flex flex-col items-center justify-center w-full gap-5">
        {/* Circling images */}
        <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{ scale: [1, 1.35, 1], opacity: [0.45, 0.7, 0.45] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 rounded-full"
              style={{ background: C.coral, filter: "blur(22px)" }}
            />
          </div>
          <CirclingElements radius={90} duration={14} direction="normal" easing="linear">
            {keralaImages.map((imgUrl, i) => (
              <div key={i} className="w-[82px] h-[82px] overflow-hidden shadow-lg pointer-events-none rounded-xl">
                <img src={imgUrl} alt={`Kerala ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </CirclingElements>
        </div>

        {/* Inline "Searching for [pill]" */}
        <div className="flex flex-row items-center gap-3 flex-nowrap whitespace-nowrap" style={{ color: C.ink }}>
          <span className="text-[24px] font-normal">Searching for</span>
          <TextRotate
            texts={["flights", "hotels", "sightseeing", "activities", "transfers", "restaurants", "experiences", "day trips"]}
            mainClassName="text-white bg-[#F85010] px-4 py-1.5 rounded-xl overflow-hidden justify-center text-[24px] font-normal"
            splitLevelClassName="overflow-hidden"
            rotationInterval={1800}
            staggerDuration={0.025}
            staggerFrom="last"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
          />
        </div>

        {/* Shimmer status line */}
        <ShimmerReasoningText lines={[
          "Analyzing your preferences...",
          "Searching for top-rated stays...",
          "Optimizing travel routes...",
          "Checking local activity availability...",
          "Finalizing your Kerala itinerary...",
        ]} />
      </div>
    </motion.div>
  );
}

// ── Activity dot ───────────────────────────────────────────────────────────
function ActivityDot({ kind }: { kind: string }) {
  const dotStyles: Record<string, { bg: string; icon: React.ReactNode }> = {
    food:      { bg: "#FFF3E0", icon: <Utensils  size={10} color="#E65100" /> },
    activity:  { bg: "#F3E8FF", icon: <Zap       size={10} color="#7C3AED" /> },
    transport: { bg: "#E0F2FE", icon: <Plane      size={10} color="#0284C7" /> },
    hotel:     { bg: C.card,    icon: <Building2  size={10} color={C.sub}  /> },
    sight:     { bg: C.coralSoft, icon: <MapPin   size={10} color={C.coral} /> },
  };
  const { bg, icon } = dotStyles[kind] ?? dotStyles["sight"];
  return (
    <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 border-white shadow-sm"
      style={{ background: bg }}>{icon}</div>
  );
}

// ── Logistics view ─────────────────────────────────────────────────────────
// ── Pricing summary bar ────────────────────────────────────────────────────
function PricingSummary({ people }: { people: number }) {
  const perPerson = 48500;
  const total = perPerson * people;
  const fmt = (v: number) => v >= 100000
    ? `₹${(v / 100000).toFixed(1).replace(/\.0$/, "")}L`
    : `₹${(v / 1000).toFixed(0)}K`;
  return (
    <div className="mx-5 mb-4 rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${C.cardBorder}`, background: C.cardBg, boxShadow: C.cardShadow }}>
      <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: `1px solid ${C.cardDivide}` }}>
        <div>
          <div className="font-normal uppercase tracking-wider mb-0.5" style={{ color: C.sub, fontSize: T.label }}>Estimated total</div>
          <div className="font-bold leading-none" style={{ color: C.ink, fontSize: T.primaryValue }}>{fmt(total)}</div>
        </div>
        <div className="text-right">
          <div className="font-normal uppercase tracking-wider mb-0.5" style={{ color: C.sub, fontSize: T.label }}>Per person</div>
          <div className="font-bold leading-none" style={{ color: C.coral, fontSize: T.primaryValue }}>{fmt(perPerson)}</div>
        </div>
      </div>
      <div className="flex" style={{ borderBottom: people > 1 ? `1px solid ${C.cardDivide}` : "none" }}>
        {[
          { label: "Flights",    value: "₹12K",  icon: <Plane size={11} /> },
          { label: "Hotels",     value: "₹28K",  icon: <Building2 size={11} /> },
          { label: "Activities", value: "₹8.5K", icon: <Zap size={11} /> },
        ].map((item, i) => (
          <div key={item.label} className="flex-1 flex flex-col items-center gap-1 py-3"
            style={{ borderLeft: i > 0 ? `1px solid ${C.cardDivide}` : "none", background: C.cardFoot }}>
            <div style={{ color: C.sub }}>{item.icon}</div>
            <div className="font-bold" style={{ color: C.ink, fontSize: T.caption }}>{item.value}</div>
            <div style={{ color: C.sub, fontSize: T.micro }}>{item.label}</div>
          </div>
        ))}
      </div>
      {people > 1 && (
        <div className="px-4 py-2.5" style={{ background: C.coralSoft }}>
          <span className="font-medium" style={{ color: C.coral, fontSize: T.caption }}>
            For {people} people · {fmt(total)} total
          </span>
        </div>
      )}
    </div>
  );
}

// ── Enhanced transport card — Cleartrip hierarchy ─────────────────────────
function TransportCard({ transport }: { transport: typeof LOGISTICS[0]["transport"] & { price: number } }) {
  const isFlight   = transport.type === "flight";
  const isConnection = transport.carrier.includes("via");
  const [depart, arrive] = transport.time.includes("→")
    ? transport.time.split("→").map(s => s.trim())
    : [transport.time, ""];
  const [origin, dest] = transport.route.includes("→")
    ? transport.route.split("→").map(s => s.trim())
    : [transport.route, ""];

  const accentBg    = isFlight ? "#EFF6FF" : "#ECFDF5";
  const accentColor = isFlight ? "#2563EB" : "#059669";

  return (
    <div className="rounded-2xl overflow-hidden mb-2.5"
      style={{ border: `1px solid ${C.cardBorder}`, background: C.cardBg, boxShadow: C.cardShadow }}>

      {/* Carrier header — micro label + pill */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5"
        style={{ borderBottom: `1px solid ${C.cardDivide}` }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: accentBg }}>
            {isFlight ? <Plane size={13} color={accentColor} /> : <Car size={13} color={accentColor} />}
          </div>
          <div>
            {/* micro label */}
            <div className="font-normal leading-none mb-0.5" style={{ color: C.sub, fontSize: T.label }}>
              {isFlight ? "Airline" : "Transport"}
            </div>
            {/* primary value */}
            <div className="font-semibold leading-none" style={{ color: C.ink, fontSize: T.body }}>
              {transport.carrier}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isConnection && (
            <span className="font-bold px-2 py-0.5 rounded-full"
              style={{ background: "#FEF3C7", color: "#92400E", fontSize: T.micro }}>1 stop</span>
          )}
          <span className="font-semibold px-2.5 py-1 rounded-full"
            style={{ fontSize: T.micro, background: accentBg, color: accentColor }}>
            {isFlight ? "Direct" : "Car hire"}
          </span>
        </div>
      </div>

      {/* Route + time block — main hierarchy */}
      {depart && arrive ? (
        <div className="flex items-center px-4 py-3.5 gap-3">
          {/* Origin */}
          <div className="flex-1 min-w-0">
            {/* micro label */}
            <div className="font-normal mb-1" style={{ color: C.sub, fontSize: T.label }}>
              {isFlight ? `Departs · ${origin}` : "Pickup"}
            </div>
            {/* primary value — large bold time */}
            <div className="font-bold tabular-nums leading-none" style={{ color: C.ink, fontSize: T.primaryValue }}>
              {depart}
            </div>
          </div>

          {/* Duration spine */}
          <div className="flex flex-col items-center gap-1 px-1 flex-shrink-0" style={{ minWidth: 64 }}>
            <div className="font-normal" style={{ color: C.sub, fontSize: T.label }}>{transport.duration}</div>
            <div className="w-full flex items-center gap-0.5">
              <div className="w-1.5 h-1.5 rounded-full border-[1.5px] flex-shrink-0" style={{ borderColor: accentColor }} />
              <div className="flex-1 h-px" style={{ background: C.hair }} />
              {isConnection && <>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#F59E0B" }} />
                <div className="flex-1 h-px" style={{ background: C.hair }} />
              </>}
              <Plane size={11} color={accentColor} className="flex-shrink-0" style={{ transform: isFlight ? "rotate(0deg)" : "none" }} />
            </div>
            {isConnection
              ? <div className="text-[9.5px] font-medium" style={{ color: "#92400E" }}>Connecting</div>
              : <div className="text-[9.5px] font-medium" style={{ color: C.good }}>Non-stop</div>
            }
          </div>

          {/* Destination */}
          <div className="flex-1 min-w-0 text-right">
            {/* micro label */}
            <div className="font-normal mb-1" style={{ color: C.sub, fontSize: T.label }}>
              {isFlight ? `Arrives · ${dest}` : "Drop-off"}
            </div>
            {/* primary value */}
            <div className="font-bold tabular-nums leading-none" style={{ color: C.ink, fontSize: T.primaryValue }}>
              {arrive}
            </div>
          </div>
        </div>
      ) : (
        /* Car/drive with no depart→arrive times */
        <div className="px-4 py-3.5">
          <div className="font-medium mb-1" style={{ color: C.sub, fontSize: T.micro }}>Pickup time</div>
          <div className="font-bold leading-none mb-1" style={{ color: C.ink, fontSize: T.primaryValue }}>{depart}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock size={11} color={C.sub} />
            <span style={{ color: C.sub, fontSize: T.label }}>{transport.duration}</span>
          </div>
        </div>
      )}

      {/* Price + other options footer */}
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ borderTop: `1px solid ${C.cardDivide}`, background: C.cardFoot }}>
        <div>
          <div className="font-normal" style={{ color: C.sub, fontSize: T.label }}>{isFlight ? "Total fare" : "Est. cost"}</div>
          <div className="font-medium" style={{ color: C.ink, fontSize: T.sectionValue }}>₹{transport.price.toLocaleString("en-IN")}</div>
        </div>
        <button className="font-semibold flex items-center gap-0.5" style={{ color: C.coral, fontSize: T.caption }}>
          Other options <ChevronRight size={12} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function LogisticsView({ people }: { people: number }) {
  const [showAlts, setShowAlts] = useState<Record<number, boolean>>({});

  return (
    <div className="pt-4 pb-28 space-y-5">
      <div className="px-5"><AiBadge /></div>
      <PricingSummary people={people} />
      {LOGISTICS.map(day => {
        const dayTotal = day.transport.price + day.hotel.priceNum;
        const altsOpen = showAlts[day.day];
        return (
          <div key={day.day} className="px-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.coral }}>
                <span className="font-medium text-white" style={{ fontSize: T.micro }}>{day.day}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-medium" style={{ color: C.ink, fontSize: T.sectionValue }}>Day {day.day}</span>
                <span style={{ color: C.sub, fontSize: T.label }}>{day.date}</span>
              </div>
            </div>

            <TransportCard transport={day.transport} />

            {/* Hotel card */}
            <div className="rounded-2xl overflow-hidden"
              style={{ border: `1px solid ${C.cardBorder}`, background: C.cardBg, boxShadow: C.cardShadow }}>
              <div className="flex gap-3 p-3.5" style={{ borderBottom: `1px solid ${C.cardDivide}` }}>
                <img src={day.hotel.img} alt={day.hotel.name}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="font-normal mb-0.5" style={{ color: C.sub, fontSize: T.label }}>
                    {day.hotel.newStay ? "Check-in" : "Staying at"}
                  </div>
                  <div className="font-medium leading-snug" style={{ color: C.ink, fontSize: T.sectionValue }}>
                    {day.hotel.name}
                  </div>
                  <div className="mt-0.5 truncate" style={{ color: C.sub, fontSize: T.caption }}>
                    {day.hotel.sub}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between px-3.5 py-2.5" style={{ background: C.cardFoot }}>
                <div>
                  <div className="font-normal" style={{ color: C.sub, fontSize: T.label }}>Stay details</div>
                  <div className="font-normal mt-0.5" style={{ fontSize: T.caption, color: day.hotel.newStay ? C.coral : C.ink }}>
                    {day.hotel.note}
                  </div>
                </div>
                {day.hotel.price && (
                  <div className="text-right">
                    <div className="font-normal" style={{ color: C.sub, fontSize: T.label }}>Per night</div>
                    <div className="font-medium" style={{ color: C.ink, fontSize: T.sectionValue }}>{day.hotel.price}</div>
                  </div>
                )}
              </div>

              {/* Other hotel options */}
              {day.hotel.alts.length > 0 && (
                <>
                  <button
                    onClick={() => setShowAlts(p => ({ ...p, [day.day]: !p[day.day] }))}
                    className="w-full flex items-center justify-between px-3.5 py-2.5"
                    style={{ borderTop: `1px solid ${C.cardDivide}` }}>
                    <span style={{ color: C.sub, fontSize: T.caption }}>Other hotel options</span>
                    <motion.div animate={{ rotate: altsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronRight size={13} color={C.sub} style={{ transform: "rotate(90deg)" }} />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {altsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: "hidden" }}>
                        <div className="px-3.5 pb-3 space-y-2.5" style={{ borderTop: `1px solid ${C.cardDivide}`, paddingTop: "10px" }}>
                          {day.hotel.alts.map((alt, ai) => (
                            <div key={ai} className="flex items-center gap-3 rounded-xl p-2.5"
                              style={{ background: C.ground, border: `1px solid ${C.cardBorder}` }}>
                              <img src={alt.img} alt={alt.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium leading-snug truncate" style={{ color: C.ink, fontSize: T.body }}>{alt.name}</div>
                                <div className="truncate" style={{ color: C.sub, fontSize: T.caption }}>{alt.sub}</div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="font-medium" style={{ color: C.ink, fontSize: T.caption }}>{alt.price}</div>
                                <button className="mt-0.5 font-medium" style={{ color: C.coral, fontSize: T.micro }}>Select</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Day total */}
            {dayTotal > 0 && (
              <div className="flex items-center justify-between mt-2.5 px-1">
                <span style={{ color: C.sub, fontSize: T.caption }}>Day {day.day} total</span>
                <span className="font-medium" style={{ color: C.ink, fontSize: T.caption }}>
                  ₹{dayTotal.toLocaleString("en-IN")}
                </span>
              </div>
            )}

            {day.day < LOGISTICS.length && <div className="flex justify-center mt-4"><div className="w-px h-4" style={{ background: C.hair }} /></div>}
          </div>
        );
      })}
      <div className="px-5">
        <button className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-opacity active:opacity-80"
          style={{ border: `2px solid ${C.coral}`, color: C.coral, fontSize: T.sectionValue }}>
          <Heart size={16} />Save Itinerary
        </button>
      </div>
    </div>
  );
}

// ── Itinerary view ─────────────────────────────────────────────────────────
function ItineraryView({ groupLabel, iteration }: { groupLabel: string; iteration: number }) {
  const [openDay, setOpenDay] = useState<number | null>(1);
  const days = iteration > 1 ? ITINERARY_DAYS_V2 : ITINERARY_DAYS;

  return (
    <div className="px-5 pt-4 pb-28">
      <AiBadge />
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-medium" style={{ color: C.ink, fontSize: T.sectionValue }}>Kerala · 5 days for {groupLabel}</h3>
        <AnimatePresence>
          {iteration > 1 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8, x: -6 }} animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ type: "spring", damping: 18, stiffness: 300 }}
              className="px-2 py-0.5 rounded-full font-medium flex-shrink-0"
              style={{ background: C.coralSoft, color: C.coral, fontSize: T.micro }}>
              Updated
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-3">
        {days.map((day, di) => {
          const isOpen = openDay === day.day;
          const img = DAY_IMAGES[di];
          return (
            <div key={day.day} className="rounded-2xl overflow-hidden"
              style={{ border: `1px solid ${isOpen ? C.ink : C.cardBorder}`, background: C.cardBg, boxShadow: C.cardShadow, transition: "border-color 0.2s" }}>

              {/* Tap header to toggle */}
              <button className="w-full text-left" onClick={() => setOpenDay(isOpen ? null : day.day)}>
                <div className="relative h-[110px] overflow-hidden">
                  <img src={img} alt={day.tagline} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Day pill */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full"
                    style={{ background: isOpen ? C.ink : "rgba(0,0,0,0.45)" }}>
                    <span className="font-medium text-white" style={{ fontSize: T.micro }}>Day {day.day}</span>
                  </div>

                  {/* Chevron */}
                  <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.35)" }}>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.22 }}>
                      <ChevronRight size={14} color="#fff" style={{ transform: "rotate(90deg)" }} />
                    </motion.div>
                  </div>

                  {/* Title overlay */}
                  <div className="absolute bottom-3 left-3 right-10">
                    <div className="text-white font-medium leading-tight drop-shadow" style={{ fontSize: T.sectionValue }}>{day.tagline}</div>
                    <div className="text-white/70 mt-0.5" style={{ fontSize: T.micro }}>{day.date}</div>
                  </div>
                </div>

                {/* Collapsed summary row */}
                {!isOpen && (
                  <div className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: `1px solid ${C.cardDivide}`, background: C.cardFoot }}>
                    <span style={{ color: C.sub, fontSize: T.caption }}>{day.activities.length} activities planned</span>
                    <div className="flex items-center gap-1 ml-auto">
                      {[...new Set(day.activities.map(a => a.kind))].map(k => (
                        <ActivityDot key={k} kind={k} />
                      ))}
                    </div>
                  </div>
                )}
              </button>

              {/* Expandable activity list */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="acts"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: "hidden" }}>
                    <div className="px-4 pt-3.5 pb-4" style={{ borderTop: `1px solid ${C.cardDivide}` }}>
                      <div className="relative">
                        <div className="absolute left-[10px] top-3 bottom-3 w-px" style={{ background: C.hair }} />
                        <div className="space-y-0">
                          {day.activities.map((act, ai) => {
                            const isNew = (act as any).isNew === true;
                            return (
                              <motion.div key={ai}
                                initial={isNew ? { opacity: 0, x: -8 } : false}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.35, delay: 0.05 * ai }}
                                className="flex items-start gap-3 relative pb-3.5 last:pb-0">
                                <ActivityDot kind={act.kind} />
                                <div className="flex-1 pt-[3px]">
                                  <div className="flex items-start gap-2 flex-wrap">
                                    <span className="font-normal whitespace-nowrap pt-[1px]" style={{ color: C.sub, fontSize: T.micro }}>{act.time}</span>
                                    <span className="font-normal leading-snug" style={{ color: C.ink, fontSize: T.body }}>{act.name}</span>
                                    {isNew && (
                                      <span className="px-1.5 py-0 rounded-full font-medium self-center"
                                        style={{ background: "#DCFCE7", color: "#16A34A", fontSize: "10px", lineHeight: "18px" }}>
                                        New
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <button className="w-full mt-5 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
        style={{ border: `2px solid ${C.coral}`, color: C.coral, fontSize: T.sectionValue }}>
        <Heart size={16} />Save Itinerary
      </button>
    </div>
  );
}

// ── Results screen ─────────────────────────────────────────────────────────
function ResultsScreen({ tab, setTab, groupType, groupCount, onClose }: {
  tab: ResultsTab; setTab: (v: ResultsTab) => void;
  groupType: GroupType | null; groupCount: number | null; onClose: () => void;
}) {
  const groupLabel = groupType === "family" ? "a family" : groupType === "solo" ? "solo" : groupType === "partner" ? "a couple" : "friends";
  const people = groupCount ?? (groupType === "solo" ? 1 : groupType === "partner" ? 2 : 2);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [chatText,    setChatText]    = useState("");
  const [listening,   setListening]   = useState(false);
  const [rewritePhase, setRewritePhase] = useState<"idle" | "in" | "done">("idle");
  const [rewriteStep,  setRewriteStep]  = useState(0);
  const [iteration,    setIteration]    = useState(1);

  // Step-by-step progression during rewrite
  useEffect(() => {
    if (rewritePhase !== "in") return;
    if (rewriteStep < REWRITE_STEPS.length) {
      const id = setTimeout(() => setRewriteStep(s => s + 1), 850);
      return () => clearTimeout(id);
    } else {
      const id = setTimeout(() => setRewritePhase("done"), 500);
      return () => clearTimeout(id);
    }
  }, [rewritePhase, rewriteStep]);

  const dismissRewrite = () => {
    if (rewritePhase !== "done") return;
    setRewritePhase("idle");
    setIteration(i => i + 1);
  };

  const handleChatSend = () => {
    const q = chatText.trim();
    if (!q) return;
    setChatText("");
    setTimeout(() => {
      setRewriteStep(0);
      setRewritePhase("in");
    }, 200);
  };

  const toggleVoice = () => {
    setListening(l => !l);
    if (!listening) {
      setTimeout(() => {
        setListening(false);
        setChatText("Can you add a cooking class on day 3?");
      }, 2200);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full relative overflow-hidden" style={{ background: C.ground }}>

      {/* Summary overlay */}
      <AnimatePresence>
        {summaryOpen && (
          <>
            <motion.div key="sum-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-40" style={{ background: `${C.ink}70` }}
              onClick={() => setSummaryOpen(false)} />
            <motion.div key="sum-panel"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="absolute inset-x-0 bottom-0 z-50 rounded-t-[28px] px-5 pt-4 pb-8"
              style={{ background: C.ground, maxHeight: "72%" }}>
              <div className="flex justify-center mb-4">
                <div className="w-8 h-[5px] rounded-full" style={{ background: C.hair }} />
              </div>
              <h3 className="font-bold mb-4" style={{ color: C.ink, fontSize: T.sectionValue }}>Your trip preferences</h3>
              <div className="space-y-3">
                {[
                  { icon: <MapPin size={14} />, label: "Destination", value: "Kerala, India" },
                  { icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1" y="2" width="12" height="11" rx="2"/><path d="M4 1v2M10 1v2M1 6h12"/></svg>, label: "Dates", value: "Nov 17 – Nov 21, 2025" },
                  { icon: <Users size={14} />,  label: "Travellers", value: `${people} ${people === 1 ? "person" : "people"} · ${groupLabel}` },
                  { icon: <Plane size={14} />,  label: "Transport", value: "Flight preferred" },
                  { icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="7" cy="7" r="6"/><path d="M7 4v3l2 2"/></svg>, label: "Budget", value: "₹50K per person" },
                  { icon: <Heart size={14} />,  label: "Interests", value: "Backwaters, Ayurveda, Food" },
                ].map(row => (
                  <div key={row.label} className="flex items-start gap-3 py-2.5 px-3 rounded-xl" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: C.cardShadow }}>
                    <div className="flex-shrink-0 mt-0.5" style={{ color: C.coral }}>{row.icon}</div>
                    <div>
                      <div className="font-normal uppercase tracking-wide mb-0.5" style={{ color: C.sub, fontSize: T.micro }}>{row.label}</div>
                      <div className="font-semibold" style={{ color: C.ink, fontSize: T.sectionValue }}>{row.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-2 pb-2 flex-shrink-0">
        <button onClick={onClose} className="p-1 -ml-1"><ArrowLeft size={20} strokeWidth={2} color={C.ink} /></button>
        <button onClick={() => setSummaryOpen(true)} className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-[7px] h-[7px] rounded-full" style={{ background: C.teal }} />
            <span className="text-[11px] font-medium" style={{ color: C.teal }}>Powered by AI</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[12px] font-bold" style={{ color: C.ink }}>Kerala, India — 5 Day Itinerary</span>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke={C.coral} strokeWidth="2" strokeLinecap="round"><path d="M2 4.5L6.5 9 11 4.5"/></svg>
          </div>
        </button>
        <button onClick={onClose} className="p-1 -mr-1"><X size={20} strokeWidth={2} color={C.ink} /></button>
      </div>

      {/* Hero image — taller, bigger text, no map button */}
      <div className="relative flex-shrink-0 h-[168px]">
        <img src="https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"
          alt="Kerala backwaters" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-white/80 text-[11.5px] font-medium mb-1">God's Own Country</div>
          <div className="text-white font-bold leading-tight drop-shadow-sm" style={{ fontSize: T.primaryValue }}>Kerala, India</div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-white/80 text-[12px]">5 Days · {people} {people===1?"person":"people"}</span>
            <span className="w-1 h-1 rounded-full bg-white/50" />
            <span className="text-white/80 text-[12px]">Nov 17–21</span>
          </div>
        </div>
      </div>

      {/* Tab switcher — more prominent with indicator dot on itinerary */}
      <div className="flex gap-0 px-4 py-3 flex-shrink-0">
        {([
          { id: "logistics" as ResultsTab, label: "Stays & Travel",  icon: <Plane size={13} strokeWidth={2.5} /> },
          { id: "itinerary" as ResultsTab, label: "Day Itinerary",   icon: <List  size={13} strokeWidth={2.5} />, dot: true },
        ]).map((btn, i) => {
          const active = tab === btn.id;
          return (
            <button key={btn.id} onClick={() => setTab(btn.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-semibold transition-all relative"
              style={{
                borderBottom: active ? `2.5px solid ${C.ink}` : `2px solid ${C.hair}`,
                color: active ? C.ink : C.sub,
                background: "transparent",
              }}>
              {btn.icon}
              {btn.label}
              {btn.dot && !active && (
                <span className="absolute top-2 right-[calc(50%-28px)] w-[7px] h-[7px] rounded-full" style={{ background: C.ink }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          {tab === "logistics" && (
            <motion.div key="logistics" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.22 }}>
              <LogisticsView people={people} />
            </motion.div>
          )}
          {tab === "itinerary" && (
            <motion.div key="itinerary" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }}>
              <ItineraryView groupLabel={groupLabel} iteration={iteration} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dark scrim — dims the content behind the reasoning card */}
      <AnimatePresence>
        {rewritePhase !== "idle" && (
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-20"
            style={{ background: "rgba(22,19,15,0.55)" }}
            onClick={rewritePhase === "done" ? dismissRewrite : undefined}
          />
        )}
      </AnimatePresence>

      {/* Bottom gradient zone — grows upward to contain the reasoning card */}
      <div className="absolute bottom-0 inset-x-0 z-30 pointer-events-none"
        style={{ background: "linear-gradient(to top, #FEEDE2 60%, rgba(253,251,248,0))" }}>

        <div className="pointer-events-auto">
          {/* Reasoning card — expands above input inside the gradient */}
          <AnimatePresence>
            {rewritePhase !== "idle" && (
              <motion.div
                key="reasoning-card"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: "hidden" }}>
                <div className="mx-4 mb-2 rounded-2xl overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(10px)", border: `1px solid rgba(248,80,16,0.12)`, boxShadow: "0 4px 24px rgba(248,80,16,0.08)" }}>

                  {/* Card header */}
                  <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5"
                    style={{ borderBottom: `1px solid rgba(248,80,16,0.08)` }}>
                    <motion.div
                      animate={rewritePhase === "in" ? { rotate: [0, 360] } : { rotate: 0 }}
                      transition={{ duration: 2, repeat: rewritePhase === "in" ? Infinity : 0, ease: "linear" }}>
                      <Sparkles size={13} color={C.coral} />
                    </motion.div>
                    <span className="font-medium flex-1" style={{ color: C.coral, fontSize: T.caption }}>
                      {rewritePhase === "in" ? "Updating itinerary…" : "Changes applied ✓"}
                    </span>
                    {rewritePhase === "done" && (
                      <span style={{ color: C.sub, fontSize: T.micro }}>Tap anywhere to close</span>
                    )}
                  </div>

                  {/* Steps */}
                  <div className="px-4 py-3 space-y-2.5">
                    {REWRITE_STEPS.map((step, i) => {
                      const shown = i < rewriteStep;
                      const isActive = i === rewriteStep - 1 && rewritePhase === "in";
                      if (!shown) return null;
                      return (
                        <motion.div key={i}
                          initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25 }}
                          className="flex items-center gap-2.5">
                          <div className="flex-shrink-0">
                            {isActive
                              ? <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
                                  className="w-3 h-3 rounded-full" style={{ background: C.coral }} />
                              : <CheckCircle2 size={13} color={C.good} />
                            }
                          </div>
                          <span className="relative overflow-hidden leading-snug flex-1"
                            style={{ color: isActive ? C.ink : C.sub, fontSize: "12px" }}>
                            {isActive && (
                              <motion.span className="absolute inset-0 pointer-events-none"
                                style={{ background: `linear-gradient(90deg,transparent,rgba(248,80,16,0.08),transparent)`, backgroundSize: "200% 100%" }}
                                animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                                transition={{ duration: 1.4, ease: "linear", repeat: Infinity }} />
                            )}
                            {step}
                          </span>
                        </motion.div>
                      );
                    })}

                    {/* Done summary */}
                    <AnimatePresence>
                      {rewritePhase === "done" && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                          className="pt-2 mt-1 space-y-1.5"
                          style={{ borderTop: `1px solid rgba(248,80,16,0.1)` }}>
                          <p className="font-medium" style={{ color: C.ink, fontSize: "12px" }}>What changed on Day 3:</p>
                          {[
                            "Added Kerala Cooking Class at 12:00 PM",
                            "Adjusted Backwater Cruise to 5:00 PM",
                          ].map((c, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: C.coral }} />
                              <span style={{ color: C.sub, fontSize: "11px" }}>{c}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input pill */}
          <div className="px-4 pb-5 pt-1">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-full"
              style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.coralSoft }}>
                <Sparkles size={12} color={C.coral} />
              </div>
              <input
                type="text" value={chatText}
                onChange={e => setChatText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleChatSend()}
                placeholder={listening ? "Listening…" : "Ask AI to change anything…"}
                className="flex-1 text-[13px] outline-none bg-transparent"
                style={{ color: C.ink, caretColor: C.coral }}
              />
              <button onClick={toggleVoice}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: listening ? C.coral : C.card }}>
                <AnimatePresence mode="wait">
                  {listening ? (
                    <motion.span key="stop" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="#fff"><rect x="4" y="1" width="6" height="9" rx="3"/><path d="M2 8a5 5 0 0010 0" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round"/><path d="M7 13v-2" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/></svg>
                      </motion.div>
                    </motion.span>
                  ) : (
                    <motion.span key="mic" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill={C.sub}><rect x="4" y="1" width="6" height="9" rx="3"/><path d="M2 8a5 5 0 0010 0" stroke={C.sub} strokeWidth="1.4" fill="none" strokeLinecap="round"/><path d="M7 13v-2" stroke={C.sub} strokeWidth="1.4" strokeLinecap="round"/></svg>
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              <AnimatePresence>
                {chatText.trim() && (
                  <motion.button key="send" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                    onClick={handleChatSend}
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: C.coral }}>
                    <ArrowUp size={14} color="#fff" strokeWidth={2.5} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────
export default function App() {
  const [mainScreen, setMainScreen] = useState<MainScreen>("home");
  const [videoSheetOpen, setVideoSheetOpen] = useState(false);
  const [sheetOpen,  setSheetOpen]  = useState(false);
  const [sheetStep,  setSheetStep]  = useState<SheetStep>("location-dates");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [destination,   setDestination]   = useState("");
  const [dateMode,      setDateMode]      = useState<DateMode>("fixed");
  const [startDate,     setStartDate]     = useState<Date | null>(null);
  const [endDate,       setEndDate]       = useState<Date | null>(null);
  const [flexDays,      setFlexDays]      = useState<number | null>(null);
  const [flexMonths,    setFlexMonths]    = useState<number[]>([]);
  const [groupType,     setGroupType]     = useState<GroupType | null>(null);
  const [groupCount,    setGroupCount]    = useState<number | null>(null);
  const [hasChildren,   setHasChildren]   = useState<boolean | null>(null);
  const [budget,        setBudget]        = useState<number>(50000);
  const [transportMode, setTransportMode] = useState<TransportMode | null>(null);
  const [interests,     setInterests]     = useState<string[]>([]);
  const [resultsTab,    setResultsTab]    = useState<ResultsTab>("logistics");

  const suggestions = searchQuery.toLowerCase().includes("kerala") ? KERALA_SUGGESTIONS : DEFAULT_SUGGESTIONS;

  const openSheet  = () => { setSheetStep("location-dates"); setSheetOpen(true); };
  const closeSheet = () => setSheetOpen(false);

  const handleVideoMakeTrip = (url: string) => {
    setVideoSheetOpen(false);
    setTimeout(() => setMainScreen("video-processing"), 300);
  };

  const handleVideoProcessingComplete = useCallback(() => {
    // Prefill form with data extracted from the simulated video
    setDestination("Kerala, India");
    setSearchQuery("Kerala, India");
    setDateMode("fixed");
    const nov17 = new Date(2025, 10, 17);
    const nov21 = new Date(2025, 10, 21);
    setStartDate(nov17);
    setEndDate(nov21);
    setGroupType("friends");
    setGroupCount(4);
    setHasChildren(false);
    setBudget(55000);
    setTransportMode("flight");
    setInterests(["Backwater Houseboat Cruise", "Varkala Cliff Beach", "Trekking in Munnar Hills", "Street Food in Thrissur", "Kovalam Beach & Surfing"]);
    setMainScreen("home");
    setTimeout(() => { setSheetStep("location-dates"); setSheetOpen(true); }, 200);
  }, []);

  const datesOk = dateMode === "fixed" ? !!(startDate && endDate) : !!(flexDays || flexMonths.length > 0);
  const canNext  =
    sheetStep === "location-dates" ? (!!destination && datesOk) :
    sheetStep === "who"            ? !!groupType :
    sheetStep === "budget"         ? !!transportMode :
    interests.length > 0;

  const handleNext = () => {
    if (sheetStep === "location-dates") { setSheetStep("who");       return; }
    if (sheetStep === "who")            { setSheetStep("budget");    return; }
    if (sheetStep === "budget")         { setSheetStep("interests"); return; }
    setSheetOpen(false);
    setTimeout(() => setMainScreen("processing"), 350);
  };
  const handleBack = () => {
    if (sheetStep === "who")       { setSheetStep("location-dates"); return; }
    if (sheetStep === "budget")    { setSheetStep("who");            return; }
    if (sheetStep === "interests") { setSheetStep("budget");         return; }
  };
  const toggleInterest  = (item: string) => setInterests(p => p.includes(item) ? p.filter(x => x !== item) : [...p, item]);
  const toggleFlexMonth = (m: number)    => setFlexMonths(p => p.includes(m)   ? p.filter(x => x !== m)   : [...p, m]);
  const handleProcessingComplete = useCallback(() => setMainScreen("results"), []);

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4"
      style={{ background: "#F0F0F0", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div className="w-[390px] h-[844px] rounded-[44px] overflow-hidden shadow-2xl flex flex-col relative"
        style={{ background: C.ground, outline: `1px solid ${C.hair}` }}>
        <StatusBar />

        <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
          <HomeScreen onStart={openSheet} onVideoTrip={() => setVideoSheetOpen(true)} />

          {/* Results overlay */}
          <AnimatePresence>
            {mainScreen === "results" && (
              <motion.div key="results"
                initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.22,1,0.36,1] }}
                className="absolute inset-0 flex flex-col z-30">
                <ResultsScreen tab={resultsTab} setTab={setResultsTab} groupType={groupType} groupCount={groupCount}
                  onClose={() => { setMainScreen("home"); setResultsTab("logistics"); }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Processing overlay */}
          <AnimatePresence>
            {mainScreen === "processing" && <ProcessingScreen key="processing" onComplete={handleProcessingComplete} />}
          </AnimatePresence>

          {/* Video processing overlay */}
          <AnimatePresence>
            {mainScreen === "video-processing" && (
              <VideoProcessingScreen key="video-processing" onComplete={handleVideoProcessingComplete} />
            )}
          </AnimatePresence>

          {/* Video link sheet */}
          <AnimatePresence>
            {videoSheetOpen && (
              <VideoLinkSheet key="video-sheet" onClose={() => setVideoSheetOpen(false)} onMakeTrip={handleVideoMakeTrip} />
            )}
          </AnimatePresence>

          {/* Bottom sheet */}
          <AnimatePresence>
            {sheetOpen && (
              <>
                <motion.div key="backdrop"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20" style={{ background: `${C.ink}66` }}
                  onClick={closeSheet} />
                <motion.div key="sheet"
                  initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="absolute inset-x-0 bottom-0 z-30 rounded-t-[28px] max-h-[90%] flex flex-col shadow-2xl"
                  style={{ background: C.ground }}>

                  <div className="flex justify-center pt-3 pb-0 flex-shrink-0">
                    <div className="w-9 h-[5px] rounded-full" style={{ background: C.hair }} />
                  </div>

                  <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
                    <div className="w-8">
                      {sheetStep !== "location-dates" && (
                        <button onClick={handleBack} className="p-1 -ml-1"><ArrowLeft size={20} strokeWidth={2} color={C.ink} /></button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-[7px] h-[7px] rounded-full" style={{ background: C.teal }} />
                      <span className="text-[12px] font-medium" style={{ color: C.teal }}>Powered by AI</span>
                    </div>
                    <button onClick={closeSheet} className="w-8 flex justify-end">
                      <X size={20} strokeWidth={2} color={C.ink} />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="flex gap-1.5 px-5 mb-3 flex-shrink-0">
                    {(["location-dates","who","budget","interests"] as SheetStep[]).map((s,i) => (
                      <div key={s} className="h-[3px] rounded-full flex-1 transition-colors duration-300"
                        style={{ background: (["location-dates","who","budget","interests"] as SheetStep[]).indexOf(sheetStep) >= i ? C.coral : C.hair }} />
                    ))}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 overflow-y-auto px-5 pb-2">
                    <AnimatePresence mode="wait">
                      {sheetStep === "location-dates" && (
                        <motion.div key="ld"
                          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                          transition={{ duration: 0.22 }}>
                          <LocationDatesContent
                            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                            destination={destination} setDestination={setDestination}
                            suggestions={suggestions}
                            dateMode={dateMode} setDateMode={setDateMode}
                            startDate={startDate} endDate={endDate}
                            onDatesChange={(s, e) => { setStartDate(s); setEndDate(e); }}
                            flexDays={flexDays} setFlexDays={setFlexDays}
                            flexMonths={flexMonths} toggleFlexMonth={toggleFlexMonth}
                          />
                        </motion.div>
                      )}
                      {sheetStep === "who" && (
                        <motion.div key="who"
                          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                          transition={{ duration: 0.22 }}>
                          <WhoContent groupType={groupType} setGroupType={setGroupType} groupCount={groupCount} setGroupCount={setGroupCount} hasChildren={hasChildren} setHasChildren={setHasChildren} />
                        </motion.div>
                      )}
                      {sheetStep === "budget" && (
                        <motion.div key="budget"
                          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                          transition={{ duration: 0.22 }}>
                          <BudgetContent budget={budget} setBudget={setBudget} transportMode={transportMode} setTransportMode={setTransportMode} />
                        </motion.div>
                      )}
                      {sheetStep === "interests" && (
                        <motion.div key="int"
                          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                          transition={{ duration: 0.22 }}>
                          <InterestsContent interests={interests} toggleInterest={toggleInterest} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* CTA */}
                  <div className="px-5 pb-7 pt-3 flex-shrink-0" style={{ borderTop: `1px solid ${C.hair}` }}>
                    <button onClick={canNext ? handleNext : undefined}
                      className="w-full h-12 rounded-xl font-semibold text-[15px] transition-all active:opacity-80"
                      style={{
                        background: canNext ? C.coral : C.hair,
                        color: canNext ? "#fff" : C.sub,
                        cursor: canNext ? "pointer" : "default",
                      }}>
                      {sheetStep === "interests" ? "Find my trip ✨" : sheetStep === "budget" ? "Set preferences" : "Next"}
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {!sheetOpen && mainScreen === "home" && (
          <div className="flex justify-center pb-2 flex-shrink-0">
            <div className="w-32 h-1 rounded-full" style={{ background: `${C.ink}20` }} />
          </div>
        )}
      </div>
    </div>
  );
}
