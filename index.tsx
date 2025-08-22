/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

// --- DOM Element References ---
const fetchBtn = document.getElementById('fetch-news-btn') as HTMLButtonElement;
const newsContainer = document.getElementById('news-container') as HTMLElement;
const performanceContainer = document.getElementById('performance-container') as HTMLElement;
const mwplContainer = document.getElementById('mwpl-container') as HTMLElement;
const loader = document.getElementById('loader') as HTMLElement;
const errorMessage = document.getElementById('error-message') as HTMLElement;
const sourcesContainer = document.getElementById('sources-container') as HTMLElement;
const sourcesList = document.getElementById('sources-list') as HTMLUListElement;
const installBanner = document.getElementById('install-banner') as HTMLElement;
const installBtn = document.getElementById('install-btn') as HTMLButtonElement;
const dismissBtn = document.getElementById('dismiss-btn') as HTMLButtonElement;


// Initialize the Google Gemini API client
let ai: GoogleGenAI;
try {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
} catch (error) {
  console.error(error);
  displayError('Failed to initialize the AI client. Please ensure the API key is set correctly.');
}

/**
 * Displays an error message in the UI.
 * @param message The error message to display.
 */
function displayError(message: string): void {
  newsContainer.style.display = 'none';
  sourcesContainer.style.display = 'none';
  performanceContainer.style.display = 'none';
  mwplContainer.style.display = 'none';
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}

/**
 * Sets the loading state of the UI.
 * @param isLoading - True to show the loader, false to hide it.
 */
function setLoading(isLoading: boolean): void {
  if (isLoading) {
    loader.style.display = 'block';
    fetchBtn.disabled = true;
    newsContainer.innerHTML = '';
    newsContainer.style.display = 'none';
    performanceContainer.innerHTML = '';
    performanceContainer.style.display = 'none';
    mwplContainer.innerHTML = '';
    mwplContainer.style.display = 'none';
    sourcesList.innerHTML = '';
    sourcesContainer.style.display = 'none';
    errorMessage.style.display = 'none';
  } else {
    loader.style.display = 'none';
    fetchBtn.disabled = false;
  }
}

type PeriodPerformance = {
    current: number;
    oneWeekAgo: number;
    twoWeeksAgo: number;
};

type SectorPerformance = {
    sector: string;
    performance: PeriodPerformance;
};

type MWPLStockPerformance = {
    stock: string;
    url?: string;
    mwpl: PeriodPerformance;
};

/**
 * Renders sector performance data as a grouped bar chart.
 * @param performanceData Array of sector performance objects with historical data.
 */
function renderSectorGraphs(performanceData: SectorPerformance[]): void {
    performanceContainer.innerHTML = '<h2>Sector Performance (%)</h2>';

    // Add legend
    const legend = document.createElement('div');
    legend.className = 'chart-legend';
    legend.innerHTML = `
        <div class="legend-item"><span class="legend-color-box current"></span>Current</div>
        <div class="legend-item"><span class="legend-color-box one-week"></span>1 Week Ago</div>
        <div class="legend-item"><span class="legend-color-box two-weeks"></span>2 Weeks Ago</div>
    `;
    performanceContainer.appendChild(legend);

    const chartFragment = document.createDocumentFragment();

    const allValues = performanceData.flatMap(d => Object.values(d.performance));
    const maxPerformance = Math.max(...allValues.map(v => Math.abs(v)), 1);

    performanceData.forEach(data => {
        const itemContainer = document.createElement('div');
        itemContainer.className = 'chart-bar-container';

        const label = document.createElement('div');
        label.className = 'chart-label';
        label.textContent = data.sector;
        
        const barsGroup = document.createElement('div');
        barsGroup.className = 'chart-bars-group';

        const periods = [
            { key: 'current', value: data.performance.current, className: 'current' },
            { key: 'oneWeekAgo', value: data.performance.oneWeekAgo, className: 'one-week' },
            { key: 'twoWeeksAgo', value: data.performance.twoWeeksAgo, className: 'two-weeks' },
        ];

        for (const period of periods) {
            if (period.value === undefined) continue;
            
            const barWrapper = document.createElement('div');
            barWrapper.className = 'chart-bar-wrapper';

            const bar = document.createElement('div');
            const isPositive = period.value >= 0;
            bar.className = `chart-bar ${isPositive ? 'positive' : 'negative'} ${period.className}`;
            bar.textContent = `${period.value.toFixed(2)}%`;

            const barWidth = (Math.abs(period.value) / maxPerformance) * 100;
            setTimeout(() => { bar.style.width = `${barWidth}%`; }, 10);

            barWrapper.appendChild(bar);
            barsGroup.appendChild(barWrapper);
        }
        
        itemContainer.appendChild(label);
        itemContainer.appendChild(barsGroup);
        chartFragment.appendChild(itemContainer);
    });

    performanceContainer.appendChild(chartFragment);
    performanceContainer.style.display = 'block';
}

/**
 * Renders MWPL data as a grouped bar chart.
 * @param mwplData Array of stock MWPL objects with historical data.
 */
function renderMWPLChart(mwplData: MWPLStockPerformance[]): void {
    mwplContainer.innerHTML = '<h2>Top 10 Stocks by MWPL (%)</h2>';

    const legend = document.createElement('div');
    legend.className = 'chart-legend';
    legend.innerHTML = `
        <div class="legend-item"><span class="legend-color-box mwpl-current"></span>Current</div>
        <div class="legend-item"><span class="legend-color-box mwpl-one-week"></span>1 Week Ago</div>
        <div class="legend-item"><span class="legend-color-box mwpl-two-weeks"></span>2 Weeks Ago</div>
    `;
    mwplContainer.appendChild(legend);

    const chartFragment = document.createDocumentFragment();

    // MWPL is 0-100, so max is 100.
    const maxPerformance = 100;

    mwplData.forEach(data => {
        const itemContainer = document.createElement('div');
        itemContainer.className = 'chart-bar-container';

        const label = document.createElement('div');
        label.className = 'chart-label';
        
        if (data.url) {
            const link = document.createElement('a');
            link.href = data.url;
            link.textContent = data.stock;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            label.appendChild(link);
        } else {
            label.textContent = data.stock;
        }
        
        const barsGroup = document.createElement('div');
        barsGroup.className = 'chart-bars-group';

        const periods = [
            { key: 'current', value: data.mwpl.current, className: 'current' },
            { key: 'oneWeekAgo', value: data.mwpl.oneWeekAgo, className: 'one-week' },
            { key: 'twoWeeksAgo', value: data.mwpl.twoWeeksAgo, className: 'two-weeks' },
        ];

        for (const period of periods) {
            if (period.value === undefined) continue;
            
            const barWrapper = document.createElement('div');
            barWrapper.className = 'chart-bar-wrapper';

            const bar = document.createElement('div');
            // MWPL is not positive/negative, it's just a value.
            bar.className = `chart-bar ${period.className}`;
            bar.textContent = `${period.value.toFixed(1)}%`;

            const barWidth = (Math.abs(period.value) / maxPerformance) * 100;
            setTimeout(() => { bar.style.width = `${barWidth}%`; }, 10);

            barWrapper.appendChild(bar);
            barsGroup.appendChild(barWrapper);
        }
        
        itemContainer.appendChild(label);
        itemContainer.appendChild(barsGroup);
        chartFragment.appendChild(itemContainer);
    });

    mwplContainer.appendChild(chartFragment);
    mwplContainer.style.display = 'block';
}

/**
 * Renders the market summary content in a structured way.
 * @param summary The summary object from the API response.
 */
function renderSummary(summary: {
  marketOverview: string;
  keySectorNews: string;
  majorCorporateAnnouncements: string;
  economicPolicyFactors: string;
}) {
  newsContainer.innerHTML = `
    <h2>Market Summary</h2>
    <h3>Market Overview</h3>
    <p>${summary.marketOverview}</p>
    <h3>Key Sector News</h3>
    <p>${summary.keySectorNews}</p>
    <h3>Major Corporate Announcements</h3>
    <p>${summary.majorCorporateAnnouncements}</p>
    <h3>Economic/Policy Factors</h3>
    <p>${summary.economicPolicyFactors}</p>
  `;
  newsContainer.style.display = 'block';
}

/**
 * Fetches news from the Gemini API and updates the UI.
 */
async function fetchNews() {
  if (!ai) {
    displayError('AI client is not initialized.');
    return;
  }

  setLoading(true);

  const prompt = `
    Analyze the latest information on India's National Stock Exchange (NSE) using real-time search.
    
    Your entire response MUST be a single JSON object inside a markdown code block ('''json ... ''').
    The JSON object must contain three top-level keys: "summary", "sectorPerformance", and "mwplPerformance".

    1.  "summary": An object containing four string properties:
        - "marketOverview": A brief on market sentiment and key index movements.
        - "keySectorNews": News from 2-3 important sectors.
        - "majorCorporateAnnouncements": Significant company news (earnings, mergers).
        - "economicPolicyFactors": National/international economic data or policy changes.

    2.  "sectorPerformance": An array of objects. Each object must have:
        - "sector" (string, e.g., "NIFTY IT").
        - "performance" (an object with "current", "oneWeekAgo", "twoWeeksAgo" as number percentages).
        Provide data for at least 3-5 key sectors.

    3.  "mwplPerformance": An array of objects. Each object must have:
        - "stock" (string, e.g., "RBLBANK").
        - "url" (string, a link to its page on moneycontrol.com).
        - "mwpl" (an object with "current", "oneWeekAgo", "twoWeeksAgo" as number percentages).
        Provide data for the top 5-10 stocks with the highest Market-Wide Position Limit (MWPL), using data from niftytrader.in. If historical data is not available, provide a reasonable estimate.

    Do not include any text or explanation outside of the JSON markdown block.
  `;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const responseText = result.text.trim();
    let jsonString = '';

    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);

    if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1];
    } else if (responseText.startsWith('{') && responseText.endsWith('}')) {
        // Fallback if the model returns raw JSON without the markdown block
        jsonString = responseText;
    } else {
        console.error("Unexpected response format:", responseText);
        throw new Error('Could not find a valid JSON block in the response.');
    }

    const data = JSON.parse(jsonString);

    if (data.summary) {
      renderSummary(data.summary);
    }
    if (data.sectorPerformance) {
      renderSectorGraphs(data.sectorPerformance);
    }
    if (data.mwplPerformance) {
      renderMWPLChart(data.mwplPerformance);
    }

    // Display sources
    const groundingMetadata = result.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.groundingChunks) {
        sourcesList.innerHTML = ''; // Clear previous sources
        const sources = new Set<string>();
        groundingMetadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.web && chunk.web.uri) {
                sources.add(JSON.stringify({uri: chunk.web.uri, title: chunk.web.title}));
            }
        });

        if (sources.size > 0) {
            sources.forEach(sourceStr => {
                const source = JSON.parse(sourceStr);
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = source.uri;
                link.textContent = source.title || source.uri;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                listItem.appendChild(link);
                sourcesList.appendChild(listItem);
            });
            sourcesContainer.style.display = 'block';
        }
    }

  } catch (error) {
    console.error('An error occurred while fetching news:', error);
    displayError(`An error occurred while fetching news: ${error}`);
  } finally {
    setLoading(false);
  }
}


// --- PWA Installation Logic ---
let deferredPrompt: any;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Show the install banner
  installBanner.style.display = 'flex';
});

installBtn.addEventListener('click', async () => {
  // Hide the banner
  installBanner.style.display = 'none';
  // Show the install prompt
  deferredPrompt.prompt();
  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User response to the install prompt: ${outcome}`);
  // We've used the prompt, and can't use it again, throw it away
  deferredPrompt = null;
});

dismissBtn.addEventListener('click', () => {
  installBanner.style.display = 'none';
});

window.addEventListener('appinstalled', () => {
    installBanner.style.display = 'none';
    deferredPrompt = null;
    console.log('PWA was installed');
});

// --- Event Listeners ---
fetchBtn.addEventListener('click', fetchNews);
document.addEventListener('DOMContentLoaded', () => {
    // Optional: Fetch news on page load
    // fetchNews(); 
});
