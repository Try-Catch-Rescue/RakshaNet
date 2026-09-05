/* ==========================================================================
   data.js — Mock/demo data for the RakshaNet Urban Flood MVP.
   No external APIs. Replace these fixtures with real API responses
   (weather, GIS, shelter registry, rescue-team telemetry) in v2.
   ========================================================================== */

const RISK_META = {
  low:      { key:'low',      color:'#22a862', banner:'linear-gradient(135deg,#22a862,#146c3f)',
              mapGrad:'radial-gradient(circle at 50% 45%, rgba(34,168,98,.35), rgba(34,168,98,.15) 60%, transparent 100%), linear-gradient(#e7ede9,#dbe4de)' },
  medium:   { key:'medium',   color:'#d0a400', banner:'linear-gradient(135deg,#d0a400,#a37f00)',
              mapGrad:'radial-gradient(circle at 50% 45%, rgba(224,139,24,.55), rgba(208,164,0,.35) 40%, rgba(34,168,98,.15) 75%, transparent 100%), linear-gradient(#e7ede9,#dbe4de)' },
  high:     { key:'high',     color:'#e08b18', banner:'linear-gradient(135deg,#d3352d,#a92722)',
              mapGrad:'radial-gradient(circle at 50% 45%, rgba(211,53,45,.85), rgba(211,53,45,.55) 22%, rgba(224,139,24,.5) 40%, rgba(224,139,24,.25) 55%, rgba(34,168,98,.18) 75%, rgba(34,168,98,.08) 100%), linear-gradient(#e7ede9,#dbe4de)' },
  critical: { key:'critical', color:'#d3352d', banner:'linear-gradient(135deg,#a92722,#6e1712)',
              mapGrad:'radial-gradient(circle at 50% 45%, rgba(150,15,10,.95), rgba(211,53,45,.75) 30%, rgba(224,139,24,.5) 55%, rgba(224,139,24,.3) 70%, transparent 100%), linear-gradient(#e7ede9,#dbe4de)' }
};

const WATER_LEVEL_KEYS = ['waterAnkle','waterKnee','waterWaist','waterChest','waterOver'];
const WATER_LEVEL_SCORES = { waterAnkle:4, waterKnee:10, waterWaist:18, waterChest:26, waterOver:34 };

function seedState(){
  return {
    risk: 'high',
    seed: { total:123, critical:19, high:37, medium:60 },
    sosRequests: [
      { id:'SOS78912', labelKey:'Child Trapped', people:3, children:1, elderly:0, medical:false, waterLevelKey:'waterChest', score:94, severity:'critical', assigned:false, icon:'🧒' },
      { id:'SOS78891', labelKey:'Elderly Person', people:2, children:0, elderly:1, medical:false, waterLevelKey:'waterChest', score:89, severity:'high', assigned:false, icon:'👴' },
      { id:'SOS78873', labelKey:'Flooded House',  people:5, children:0, elderly:0, medical:false, waterLevelKey:'waterWaist', score:72, severity:'high', assigned:false, icon:'🏠' }
    ],
    teams: [
      { name:'Team Alpha',   status:'En route',  dist:'2.4 km', busy:true,  lat:22.5800, lng:88.3550 },
      { name:'Team Bravo',   status:'On site',   dist:'1.1 km', busy:true,  lat:22.5650, lng:88.3800 },
      { name:'Team Charlie', status:'En route',  dist:'3.6 km', busy:true,  lat:22.5500, lng:88.3300 },
      { name:'Team Delta',   status:'Available', dist:'0.8 km', busy:false, lat:22.5900, lng:88.3700 },
      { name:'Team Echo',    status:'Available', dist:'4.2 km', busy:false, lat:22.5300, lng:88.3900 }
    ],
    shelters: [
      { name:'Victoria Memorial School', dist:'1.2 km', cap:500, occ:230, lat:22.5448, lng:88.3426 },
      { name:'Kolkata Municipal Hall',   dist:'1.8 km', cap:300, occ:300, lat:22.5697, lng:88.3697 },
      { name:'Ramakrishna Mission',      dist:'2.3 km', cap:400, occ:150, lat:22.5185, lng:88.3654 }
    ],
    reliefRequests: []
  };
}

const BLOCKED_ROADS = [
  { name:'Strand Road (riverside)',      dist:'0.6 km', status:'Waterlogged — impassable',  lat:22.5800, lng:88.3450 },
  { name:'AJC Bose Road, Park Circus',   dist:'1.4 km', status:'Partial — 1 lane open',      lat:22.5350, lng:88.3700 },
  { name:'EM Bypass, Science City',      dist:'3.9 km', status:'Waterlogged — impassable',   lat:22.5250, lng:88.4050 }
];

const ADMIN_ALERTS = [
  { title:'Heavy Rainfall Warning',   body:'IMD forecasts 80–100mm rainfall over next 6 hours across Kolkata Metro.',            severity:'high',     mins:6 },
  { title:'Hooghly River — Danger Mark',body:'Gauge reading crossed danger mark at 4.0m near Babughat.',                          severity:'critical', mins:12 },
  { title:'Shelter Capacity Alert',   body:'Kolkata Municipal Hall shelter at 100% capacity — redirect new arrivals.',            severity:'medium',   mins:31 },
  { title:'Power Outage Reported',    body:'Ward 9–11 reporting intermittent power loss due to waterlogged transformers.',        severity:'medium',   mins:52 }
];


const RANDOM_SOS_LABELS = ['Flooded House','Family Stranded','Trapped in Vehicle','Rooftop Rescue Needed','Building Collapse Risk'];

/* -------- new datasets for advanced/offline-ready features -------- */

let WATER_LEVEL_HISTORY = [
  { label:'06:00', level:1.2 }, { label:'08:00', level:1.8 }, { label:'10:00', level:2.4 },
  { label:'12:00', level:3.1 }, { label:'14:00', level:3.8 }, { label:'16:00', level:4.4 }
];
const DANGER_MARK_M = 4.0;
const WATER_SENSOR_META = { station:'Hooghly River — Babughat Gauge', id:'HGY-KOL-07', updatedSeconds:12 };
let WATER_SIM_MODE = 'auto'; // auto | rising | falling | steady
let WATER_SIM_TIMER = null;


const RELIEF_CATEGORIES = [
  { key:'food',     icon:'🍚', name:'Food Packets',   available:1200, unit:'packets' },
  { key:'water',    icon:'💧', name:'Drinking Water', available:800,  unit:'litres' },
  { key:'medical',  icon:'💊', name:'Medical Kits',   available:150,  unit:'kits' },
  { key:'blanket',  icon:'🧣', name:'Blankets',       available:300,  unit:'pcs' }
];

const MEDICAL_FACILITIES = [
  { name:'SSKM Hospital — Emergency',        dist:'2.1 km', beds:12, phone:'+913322041101' },
  { name:'Community Health Camp — Ward 9',   dist:'0.9 km', beds:5,  phone:'+911800111555' },
  { name:'AMRI Hospital',                    dist:'3.4 km', beds:8,  phone:'+913366800000' }
];

const FOOD_SUPPLY_POINTS = [
  { name:'Ward 9 Community Kitchen',   dist:'0.7 km', status:'Serving now',            stock:'High' },
  { name:'Relief Truck — Route B',     dist:'1.5 km', status:'En route · ETA 20 min',  stock:'Medium' },
  { name:'Central Distribution Camp',  dist:'2.8 km', status:'Open',                   stock:'High' }
];

const SITUATION_FEED = [
  { region:'Kolkata, WB',    hazard:'Flood',       severity:'critical', update:'Water level rising in Ward 9–12', mins:4 },
  { region:'Howrah, WB',     hazard:'Flood',       severity:'high',     update:'Two new shelters opened',         mins:22 },
  { region:'Puri, Odisha',   hazard:'Cyclone',     severity:'medium',   update:'Coastal wind advisory issued',    mins:48 },
  { region:'Guwahati, Assam',hazard:'Flood',       severity:'high',     update:'Brahmaputra above danger mark',   mins:65 },
  { region:'Chennai, TN',    hazard:'Heavy Rain',  severity:'low',      update:'Monitoring urban drainage',       mins:110 }
];
