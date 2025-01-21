const newColors = {
  "--color-purple-light-1": "#aa8dfc",
  "--color-purple-light-2": "#9370f9",
  "--color-purple-light-3": "#815af7",
  "--color-purple-primary": "#6f42f3",
  "--color-purple-dark-1": "#6439e4",
  "--color-purple-dark-2": "#5a30d7",
  "--color-purple-dark-3": "#4f28c0",
  "--color-violet-light-1": "#ed79d5",
  "--color-violet-light-2": "#e55ecb",
  "--color-violet-light-3": "#de45c6",
  "--color-violet-primary": "#d42fc2",
  "--color-violet-dark-1": "#cc1dc1",
  "--color-violet-dark-2": "#c00fc4",
  "--color-violet-dark-3": "#ac06bc",
  "--color-yellow-light-1": "#ffe18e",
  "--color-yellow-light-2": "#fedb7c",
  "--color-yellow-light-3": "#fdd66b",
  "--color-yellow-primary": "#faca48",
  "--color-yellow-dark-1": "#f5bf2a",
  "--color-yellow-dark-2": "#edb312",
  "--color-yellow-dark-3": "#e4a700",
  "--color-orange-light-1": "#ffb154",
  "--color-orange-light-2": "#fd9d39",
  "--color-orange-light-3": "#f98925",
  "--color-orange-primary": "#f27716",
  "--color-orange-dark-1": "#ea670e",
  "--color-orange-dark-2": "#de5809",
  "--color-orange-dark-3": "#cf4a06",
  "--color-teal-light-1": "#66d9e8",
  "--color-teal-light-2": "#3bc9db",
  "--color-teal-light-3": "#22b8cf",
  "--color-teal-primary": "#15aabf",
  "--color-teal-dark-1": "#1098ad",
  "--color-teal-dark-2": "#0c8599",
  "--color-teal-dark-3": "#0b7285",
  "--color-lime-light-1": "#e9fac8",
  "--color-lime-light-2": "#d8f5a2",
  "--color-lime-light-3": "#c0eb75",
  "--color-lime-primary": "#a9e34b",
  "--color-lime-dark-1": "#94d82d",
  "--color-lime-dark-2": "#82c91e",
  "--color-lime-dark-3": "#74b816",
  "--color-green-light-1": "#60d275",
  "--color-green-light-2": "#40c35d",
  "--color-green-light-3": "#28b44e",
  "--color-green-primary": "#16a544",
  "--color-green-dark-1": "#0b963f",
  "--color-green-dark-2": "#04873b",
  "--color-green-dark-3": "#007838",
  "--color-red-light-1": "#ff6f6f",
  "--color-red-light-2": "#f85454",
  "--color-red-light-3": "#ee3e3e",
  "--color-red-primary": "#e02c2c",
  "--color-red-dark-1": "#d32020",
  "--color-red-dark-2": "#c21515",
  "--color-red-dark-3": "#b10d0d",
  "--color-blue-light-1": "#54a9fe",
  "--color-blue-light-2": "#3b97f3",
  "--color-blue-light-3": "#2a88e6",
  "--color-blue-primary": "#1976d2",
  "--color-blue-dark-0": "#ffffff",
  "--color-blue-dark-1": "#1265c2",
  "--color-blue-dark-2": "#0a59b2",
  "--color-blue-dark-3": "#004ba0",
  "--color-white": "#000000",
  "--color-lightui-surface-1": "#040404",
  "--color-lightui-surface-2": "#202020",
  "--color-lightui-surface-3": "#101010",
  "--color-lightui-surface-4": "#555",
  "--color-lightui-accent-1": "#1a1a1a",
  "--color-lightui-accent-2": "#555",
  "--color-darkui-accent-3": "#595959",
  "--color-darkui-accent-2": "#6c6c6c",
  "--color-darkui-accent-1": "#aeaeae",
  "--color-darkui-surface-4": "#c4c4c4",
  "--color-darkui-surface-3": "#ffffff",
  "--color-darkui-surface-2": "#e2e2e2",
  "--color-darkui-surface-1": "#efefef",
  "--color-black": "#ffffff",
  "--color-blue-light-1-30": "rgba(84, 169, 254, 0.3)",
  "--color-blue-light-1-50": "rgba(84, 169, 254, 0.5)",
  "--color-white-85": "rgba(0, 0, 0, 0.85)",
  "--color-white-25": "rgba(0, 0, 0, 0.25)",
  "--color-lightui-surface-1-90": "rgba(4, 4, 4, 0.9)",
  "--color-black-50": "rgba(255, 255, 255, 0.5)",
  "--color-black-10": "rgba(255, 255, 255, 0.1)",
  "--color-darkui-accent-2-50": "rgba(147, 147, 147, 0.5)",
  "--color-darkui-accent-2-80": "rgba(147, 147, 147, 0.8)",
  "--color-712": "#ff5d7c",
  "--color-711": "#d527c0",
  "--color-710": "#ddc909",
  "--color-709": "#6f42f3",
  "--color-708": "#815af7",
  "--color-707": "#a606bc",
  "--color-706": "#df88cd",
  "--color-705": "#cf18c4",
  "--color-704": "#de33cb",
  "--color-703": "#9c00ff",
  "--color-702": "#6439e4",
  "--color-701": "#cf23b8",
  "--color-700": "#632d5c",
  "--color-617": "#ff9735",
  "--color-616": "#f27019",
  "--color-615": "#feaf5a",
  "--color-614": "#ff841e",
  "--color-613": "#fed7a5",
  "--color-612": "#ed7e00",
  "--color-611": "#ff9e0d",
  "--color-610": "#ffbc50",
  "--color-609": "#ffbc50",
  "--color-608": "#ff9406",
  "--color-607": "#ffa910",
  "--color-606": "#ffdd9e",
  "--color-605": "#ed7e00",
  "--color-604": "#e9ae00",
  "--color-602": "#cc6300",
  "--color-601": "#ff9e0d",
  "--color-600": "#fc9e31",
  "--color-504": "#eebe1b",
  "--color-503": "#000010",
  "--color-502": "#fde37d",
  "--color-501": "#daf200",
  "--color-500": "#f8e700",
  "--color-424": "rgba(80, 176, 18, 0.03)",
  "--color-423": "rgba(80, 176, 18, 0.5)",
  "--color-422": "#0f6a37",
  "--color-421": "#289e3f",
  "--color-420": "#54e0b5",
  "--color-419": "#11b886",
  "--color-418": "#22b573",
  "--color-417": "#0aa476",
  "--color-416": "#74b816",
  "--color-415": "#94d82d",
  "--color-414": "#c0eb75",
  "--color-413": "#b6d56b",
  "--color-412": "#d6ff32",
  "--color-411": "#110b13",
  "--color-410": "#31d9c8",
  "--color-409": "#90e71b",
  "--color-408": "#72ea24",
  "--color-407": "#9af144",
  "--color-406": "#76ffe5",
  "--color-405": "#c1f89d",
  "--color-404": "#d2fab8",
  "--color-402": "#bbd86c",
  "--color-401": "#50b012",
  "--color-400": "#2a894f",
  "--color-309": "#df4d18",
  "--color-308": "#c92a2a",
  "--color-307": "#ffc5d2",
  "--color-306": "#b10d0d",
  "--color-305": "#fa516f",
  "--color-304": "#bd142a",
  "--color-303": "#c3072a",
  "--color-302": "#930d24",
  "--color-301": "#ff0035",
  "--color-300": "#bf0f24",
  "--color-228": "#7ed9ff",
  "--color-227": "#54a9fe",
  "--color-226": "#1976d2",
  "--color-225": "#26b2f1",
  "--color-224": "#10a9ed",
  "--color-223": "#1265c2",
  "--color-222": "#35f0f4",
  "--color-221": "#e6f2ff",
  "--color-220": "#a9d4fe",
  "--color-219": "#b0e1f7",
  "--color-218": "#8cd3fa",
  "--color-217": "#11a9ed",
  "--color-216": "#216cc0",
  "--color-215": "#e1f4fc",
  "--color-214": "#00a2ea",
  "--color-213": "#13b2ea",
  "--color-212": "#0d82b5",
  "--color-211": "#3ff1ff",
  "--color-210": "rgba(171, 229, 252, 0.8)",
  "--color-209": "#3397ed",
  "--color-208": "#c8ebfa",
  "--color-207": "#10a8ec",
  "--color-206": "#16b7ef",
  "--color-205": "#0d87bd",
  "--color-204": "#8fd6f7",
  "--color-203": "#1976d2",
  "--color-202": "#73d4ff",
  "--color-201": "#11a9ed",
  "--color-200": "#0c7cad",
  "--color-148": "#a6a6a6",
  "--color-147": "#dddddd",
  "--color-146": "#939393",
  "--color-145": "#0b0b0b",
  "--color-144": "#aeaeae",
  "--color-143": "#939393",
  "--color-142": "#1a1a1a",
  "--color-141": "rgba(5, 5, 5, 0.1)",
  "--color-140": "#191919",
  "--color-139": "#b5b5b5",
  "--color-138": "#1f1f1f",
  "--color-137": "rgba(255, 255, 255, 0.9)",
  "--color-136": "#2c2c2c",
  "--color-135": "rgba(145, 122, 107, 0.2)",
  "--color-134": "#917a6b",
  "--color-133": "rgba(0, 0, 0, 0.75)",
  "--color-132": "#555555",
  "--color-131": "#ffffff",
  "--color-130": "#171717",
  "--color-129": "rgba(92, 43, 5, 0.2)",
  "--color-128": "#d7d7d7",
  "--color-127": "#dadada",
  "--color-126": "#555",
  "--color-125": "rgba(255, 255, 255, 0.9)",
  "--color-124": "#0d0d0d",
  "--color-123": "rgba(0, 0, 0, 0.15)",
  "--color-122": "#3f3f3f",
  "--color-121": "#f1ccb3",
  "--color-120": "#bbbbbb",
  "--color-119": "#444444",
  "--color-118": "#555",
  "--color-117": "#dedede",
  "--color-116": "#eaeaea",
  "--color-115": "#0d0d0d",
  "--color-114": "#666666",
  "--color-113": "#888888",
  "--color-112": "#cccccc",
  "--color-111": "#5b5b5b",
  "--color-110": "#121212",
  "--color-109": "#555",
  "--color-108": "#555",
  "--color-107": "#555",
  "--color-106": "#252525",
  "--color-105": "#202020",
  "--color-104": "#202020",
  "--color-103": "#555",
  "--color-102": "#777777",
  "--color-101": "#ffffff",
  "--color-100": "#dddddd",
  "--color-icon-secondary-hover:": "var(--color-white)",
  "--color-icon-secondary-dark:": "var(--color-lightui-surface-3)",
  "--color-icon-secondary:": "var(--color-lightui-accent-2)",
  "--color-icon-primary-hover:": "var(--color-orange-light-1)",
  "--color-icon-primary:": "var(--color-orange-primary)",
  "--color-text-dark:": "var(--color-white)",
  "--color-text-medium:": "var(--color-lightui-accent-2)",
  "--color-text-light:": "var(--color-black)",
  "--color-secondary:": "var(--color-lightui-accent-2)",
  "--color-primary:": "var(--color-orange-primary)",
  "--color-highlight": "#4B2702",
};

const root = document.documentElement;

for (const [key, value] of Object.entries(newColors)) {
  root.style.setProperty(key, value);
}

// Scrollbar

const darkScrollbar = `
  ::-webkit-scrollbar {
    width: 9px;
    height: 5px;
  }
  ::-webkit-scrollbar-thumb {
    background-color: #888;
    border-color: #1a1a1a;
    border-width: 0 2px;
    border-height: 0 2px;
    border-style: solid;
  }
`;

const style = document.createElement("style");
style.textContent = darkScrollbar;
document.head.appendChild(style);