import { db } from '@/lib/neondb';
import { h1b_sponsors } from '@/drizzle/schema';
import { normalizeCompanyName } from './h1b-checker';
import { count } from 'drizzle-orm';

const H1B_COMPANIES = [
  // Big Tech
  'Amazon', 'Google', 'Microsoft', 'Apple', 'Meta', 'Netflix', 'Uber', 'Lyft', 'Airbnb',
  'Salesforce', 'Oracle', 'IBM', 'Intel', 'Qualcomm', 'Nvidia', 'Adobe', 'VMware', 'Cisco',
  'Dell', 'HP', 'Hewlett Packard', 'Twitter', 'LinkedIn', 'Snap', 'Pinterest', 'Dropbox',
  'Stripe', 'Square', 'Block', 'PayPal', 'Intuit', 'ServiceNow', 'Workday', 'Splunk',
  'Palo Alto Networks', 'CrowdStrike', 'Okta', 'Twilio', 'Zoom', 'Atlassian',
  'MongoDB', 'Databricks', 'Snowflake', 'Palantir', 'Cloudflare', 'Fastly', 'Akamai',
  'Roblox', 'Epic Games', 'Electronic Arts', 'Unity Technologies',
  'Autodesk', 'Cadence Design Systems', 'Synopsys', 'Marvell Technology', 'Broadcom',
  'Texas Instruments', 'Applied Materials', 'Lam Research', 'KLA Corporation',
  'Western Digital', 'Seagate', 'Micron Technology', 'Samsung Electronics America',
  'LG Electronics', 'Sony Electronics', 'Panasonic',
  // Consulting / IT Services
  'Deloitte', 'Accenture', 'Cognizant', 'Infosys', 'Tata Consultancy Services', 'Wipro',
  'HCL Technologies', 'Tech Mahindra', 'Capgemini', 'CGI', 'EPAM Systems', 'Globant',
  'ThoughtWorks', 'KPMG', 'PwC', 'Ernst Young', 'McKinsey', 'Boston Consulting Group',
  'Bain Company', 'Booz Allen Hamilton', 'Leidos', 'SAIC', 'ManTech', 'Unisys',
  'DXC Technology', 'Fujitsu America', 'NTT Data', 'Mphasis',
  'Hexaware Technologies', 'Mastech Digital',
  // Healthcare & Pharma
  'Johnson Johnson', 'Pfizer', 'Merck', 'Abbott', 'Medtronic', 'Boston Scientific',
  'Becton Dickinson', 'Baxter International', 'Zimmer Biomet', 'Stryker', 'Hologic',
  'Edwards Lifesciences', 'Intuitive Surgical', 'Align Technology', 'Dexcom',
  'Illumina', 'Bio-Rad Laboratories', 'Agilent Technologies',
  'Thermo Fisher Scientific', 'IQVIA',
  'AbbVie', 'Gilead Sciences', 'Amgen', 'Biogen', 'Regeneron', 'Moderna',
  'Genentech', 'Roche', 'Novartis', 'AstraZeneca', 'GlaxoSmithKline', 'Sanofi',
  'Bayer', 'Bristol Myers Squibb', 'Eli Lilly', 'Vertex Pharmaceuticals',
  // Finance
  'JPMorgan Chase', 'Goldman Sachs', 'Morgan Stanley', 'Bank of America', 'Citigroup',
  'Wells Fargo', 'Capital One', 'American Express', 'Charles Schwab', 'Fidelity Investments',
  'Vanguard', 'BlackRock', 'State Street', 'T Rowe Price', 'Franklin Templeton',
  'Citadel', 'Two Sigma', 'DE Shaw', 'Jane Street', 'Optiver', 'Virtu Financial',
  'Bloomberg', 'FactSet', 'Morningstar', 'S&P Global', 'Visa', 'Mastercard',
  // Aerospace & Defense
  'Boeing', 'Lockheed Martin', 'Raytheon Technologies', 'Northrop Grumman', 'General Dynamics',
  'L3Harris Technologies', 'Honeywell', 'SpaceX', 'Blue Origin', 'Rocket Lab',
  'Sierra Nevada Corporation', 'Joby Aviation', 'Waymo', 'Mobileye',
  // Automotive & EV
  'Tesla', 'General Motors', 'Ford Motor', 'Toyota Motor North America',
  'Honda North America', 'Hyundai Motor America', 'BMW North America', 'Mercedes-Benz USA',
  'Volkswagen Group of America', 'Rivian', 'Lucid Motors',
  // Retail & E-commerce
  'Walmart', 'Target', 'Costco', 'Home Depot', 'Best Buy', 'eBay', 'Etsy', 'Shopify',
  'Wayfair', 'Chewy', 'Instacart', 'DoorDash',
  // Media & Entertainment
  'Walt Disney', 'NBCUniversal', 'Comcast', 'Verizon', 'AT&T', 'T-Mobile',
  'Spotify', 'SiriusXM',
  // Cloud & SaaS
  'SAP America', 'HubSpot', 'Zendesk', 'Freshworks', 'RingCentral', 'Qualtrics', 'Medallia',
  // Semiconductors
  'AMD', 'ARM Holdings', 'Rambus', 'Silicon Laboratories',
  'Microchip Technology', 'Analog Devices', 'ON Semiconductor',
  'NXP Semiconductors', 'Infineon Technologies America', 'STMicroelectronics',
  // Logistics
  'FedEx', 'UPS', 'DHL', 'XPO Logistics',
  // Energy
  'ExxonMobil', 'Chevron', 'ConocoPhillips', 'Halliburton', 'Baker Hughes',
  'NextEra Energy', 'Duke Energy', 'Exelon', 'Dominion Energy',
  // Insurance & Healthcare
  'Cigna', 'Anthem', 'Aetna', 'Humana', 'UnitedHealth Group', 'Centene',
  'Quest Diagnostics', 'Laboratory Corporation', 'HCA Healthcare',
  // Manufacturing
  'General Electric', 'Siemens', '3M', 'Emerson Electric', 'Rockwell Automation',
  'AECOM', 'Jacobs Engineering', 'Fluor', 'Bechtel',
  // Consumer Goods
  'Colgate-Palmolive', 'Procter Gamble', 'Unilever', 'Kimberly-Clark',
  'Estee Lauder', 'Herbalife',
];

export async function seedH1BSponsors(): Promise<{ inserted: number; alreadySeeded: boolean }> {
  const [existing] = await db.select({ c: count() }).from(h1b_sponsors);
  if (existing.c > 0) {
    return { inserted: 0, alreadySeeded: true };
  }

  const rows = H1B_COMPANIES.map((name) => ({
    company_name: name,
    normalized_name: normalizeCompanyName(name),
  }));

  await db.insert(h1b_sponsors).values(rows);
  return { inserted: rows.length, alreadySeeded: false };
}
