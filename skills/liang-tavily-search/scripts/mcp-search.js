#!/usr/bin/env node

/**
 * Tavily MCP Search Client (SSE)
 * Usage: node tavily-mcp-search.js "your query"
 */

const { EventSource } = await import('eventsource');

const TAVILY_MCP_URL = 'https://mcp.tavily.com/mcp/';
const TAVILY_API_KEY = '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';

const query = process.argv[2];
if (!query) {
  console.error('Usage: node tavily-mcp-search.js "your query"');
  process.exit(1);
}

async function search() {
  return new Promise((resolve, reject) => {
    // 创建 SSE 连接
    const sseUrl = new URL(TAVILY_MCP_URL);
    sseUrl.searchParams.set('tavilyApiKey', TAVILY_API_KEY);
    
    const es = new EventSource(sseUrl.toString(), {
      headers: {
        'Accept': 'text/event-stream'
      }
    });

    let messageId = 1;
    
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('MCP Response:', JSON.stringify(data, null, 2));
        es.close();
        resolve(data);
      } catch (e) {
        console.error('Parse error:', e.message);
      }
    };

    es.onerror = (err) => {
      console.error('SSE Error:', err.message);
      es.close();
      reject(err);
    };

    // 连接建立后发送请求
    es.onopen = async () => {
      console.log('Connected to Tavily MCP, sending request...');
      
      // 发送初始化消息
      const initResponse = await fetch(TAVILY_MCP_URL + '?tavilyApiKey=' + TAVILY_API_KEY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: messageId++,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'openclaw-tavily-client',
              version: '1.0.0'
            }
          }
        })
      });

      // 发送搜索请求
      const searchResponse = await fetch(TAVILY_MCP_URL + '?tavilyApiKey=' + TAVILY_API_KEY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: messageId++,
          method: 'tools/call',
          params: {
            name: 'tavily_search',
            arguments: {
              query: query,
              max_results: 10
            }
          }
        })
      });

      const result = await searchResponse.json();
      console.log('Search Result:', JSON.stringify(result, null, 2));
      es.close();
      resolve(result);
    };

    // 超时处理
    setTimeout(() => {
      es.close();
      reject(new Error('Timeout'));
    }, 30000);
  });
}

search().catch(console.error);
