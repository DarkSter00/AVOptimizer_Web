const API_URL = "http://localhost:8000/api";
const WS_URL = "ws://localhost:8000/ws";

// Riferimenti DOM
const lblFiles = document.getElementById("lbl-files");
const lblSkipped = document.getElementById("lbl-skipped");
const lblErrors = document.getElementById("lbl-errors");
const lblSavedSpace = document.getElementById("lbl-saved-space");
const globalProgress = document.getElementById("global-progress");

const scannerWidget = document.getElementById("scanner-widget");
const scannerStepText = document.getElementById("scanner-step-text");
const scannerBg = document.getElementById("scanner-bg");
const scannerFileText = document.getElementById("scanner-file-text");
const scannerPctText = document.getElementById("scanner-pct-text");

const canvasArea = document.getElementById("canvas-area");
const topNavbar = document.getElementById("top-navbar");
const btnTogglePlay = document.getElementById("btn-toggle-play");
const btnAddFolder = document.getElementById("btn-add-folder");

const uiLoadingOverlay = document.getElementById("ui-loading-overlay");
const uiLoadingText = document.getElementById("ui-loading-text");
const uiBuilderBg = document.getElementById("ui-builder-bg");

const btnMobileMenu = document.getElementById("btn-mobile-menu");
const mobileOverlay = document.getElementById("mobile-overlay");
const sidebar = document.querySelector(".sidebar");

// Variabili di Stato Globali
let isBuildingCanvas = false;
let coreList = [];
let currentCoreIndex = -1;

let expandedCards = new Set();
let userOpenedCards = new Set();
let folderCloseTimers = {};

window.morphLeaveTimers = {};
let openMorphsTracker = {};

let lastMetrics = null;
let isPaused = true;
let lastRenderTime = 0;
let renderTimeout = null;

let fileEtaCache = {};
let folderEtaCache = {};

const pathIdMap = new Map();
let pathIdCounter = 0;
let dragCounter = 0;