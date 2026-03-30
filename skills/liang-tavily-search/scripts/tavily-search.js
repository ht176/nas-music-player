#!/usr/bin/env node

/**
 * Tavily Search API Client
 * Usage: node tavily-search.js "your query" [options]
 * Options: -n 10 --depth basic --topic general
 */

const TAVILY_API_URL = 'https://api.tavily.com/search';
const TAVILY_API_KEY = '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';

// 解析命令行参数
const args = process.argv.slice(2);
let query = '';
let maxResults = 10;
let searchDepth = 'basic'; // ultra-fast, fast, basic, advanced
let topic = 'general'; // general, news
let timeRange = null; // day, week, month, year
let includeDomains = [];
let excludeDomains = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-n' && args[i + 1]) {
    maxResults = parseInt(args[++i]);
  } else if (args[i] === '--depth' && args[i + 1]) {
    searchDepth = args[++i];
  } else if (args[i] === '--topic' && args[i + 1]) {
    topic = args[++i];
  } else if (args[i] === '--time-range' && args[i + 1]) {
    timeRange = args[++i];
  } else if (args[i] === '--include-domains' && args[i + 1]) {
    includeDomains = args[++i].split(',');
  } else if (args[i] === '--exclude-domains' && args[i + 1]) {
    excludeDomains = args[++i].split(',');
  } else if (!args[i].startsWith('-')) {
    query = args[i];
  }
}

if (!query) {
  console.error('Usage: node tavily-search.js "your query" [options]');
  console.error('Options:');
  console.error('  -n <count>           Number of results (default: 10)');
  console.error('  --depth <mode>       Search depth: ultra-fast, fast, basic, advanced');
  console.error('  --topic <topic>      Topic: general, news');
  console.error('  --time-range <range> Time range: day, week, month, year');
  console.error('  --include-domains    Comma-separated domains to include');
  console.error('  --exclude-domains    Comma-separated domains to exclude');
  process.exit(1);
}

async function search() {
  try {
    const requestBody = {
      api_key: TAVILY_API_KEY,
      query: query,
      max_results: maxResults,
      search_depth: searchDepth,
      topic: topic,
      include_answer: true,
      include_raw_content: false
    };

    if (timeRange) requestBody.time_range = timeRange;
    if (includeDomains.length) requestBody.include_domains = includeDomains;
    if (excludeDomains.length) requestBody.exclude_domains = excludeDomains;

    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // 格式化输出
    console.log(`\n🔍 Query: ${query}\n`);
    console.log(`📊 Found ${result.results?.length || 0} results\n`);
    
    if (result.answer) {
      console.log(`💡 Answer: ${result.answer}\n`);
    }
    
    if (result.results && result.results.length > 0) {
      result.results.forEach((r, i) => {
        console.log(`${i + 1}. ${r.title}`);
        console.log(`   URL: ${r.url}`);
        console.log(`   Score: ${r.score}`);
        console.log(`   ${r.content?.substring(0, 200)}...\n`);
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

search();
