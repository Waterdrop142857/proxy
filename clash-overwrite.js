// 地区配置定义
const regionConfigs = [
    { name: "香港", icon: "🇭🇰", regex: /(香港|HK|Hong Kong|Hkg)/i, key: "HK" },
    { name: "澳门", icon: "🇲🇴", regex: /(澳门|MO|Macao|Macau)/i, key: "MO" },
    { name: "台湾", icon: "🇹🇼", regex: /(台湾|TW|Taiwan|Tai Wan)/i, key: "TW" },
    { name: "日本", icon: "🇯🇵", regex: /(日本|JP|Japan|Tokyo|Osaka)/i, key: "JP" },
    { name: "新加坡", icon: "🇸🇬", regex: /(新加坡|SG|Singapore)/i, key: "SG" },
    { name: "美国", icon: "🇺🇸", regex: /(美国|US|United States|America)/i, key: "US" },
    { name: "英国", icon: "🇬🇧", regex: /(英国|UK|United Kingdom|Britain)/i, key: "UK" },
];

function main(params) {
    if (!params.proxies) return params;

    // 1. 基础配置覆写
    params["mixed-port"] = 7897;
    params["allow-lan"] = true;
    params["unified-delay"] = true;
    params["log-level"] = "warning";

    // 2. DNS 覆写 (Fake-IP 模式)
    params.dns = {
        enable: true,
        "prefer-h3": false,
        "ipv6": false,
        "enhanced-mode": "fake-ip",
        "fake-ip-filter": [
            "*.lan",
            "*.localdomain",
            "*.example",
            "*.invalid",
            "*.localhost",
            "*.test",
            "*.local",
            "*.home.arpa",
            "time.*.com",
            "time.*.gov",
            "time.*.edu.cn",
            "time.*.apple.com",
            "time1.*.com",
            "time2.*.com",
            "time3.*.com",
            "time4.*.com",
            "time5.*.com",
            "time6.*.com",
            "time7.*.com",
            "ntp.*.com",
            "ntp1.*.com",
            "ntp2.*.com",
            "ntp3.*.com",
            "ntp4.*.com",
            "ntp5.*.com",
            "ntp6.*.com",
            "ntp7.*.com",
            "*.time.edu.cn",
            "*.ntp.org.cn",
            "+.pool.ntp.org",
            "time1.cloud.tencent.com",
            "stun.*.*",
            "stun.*.*.*",
            "swscan.apple.com",
            "mesu.apple.com",
            "music.163.com",
            "*.music.163.com",
            "*.126.net",
            "musicapi.taihe.com",
            "music.taihe.com",
            "songsearch.kugou.com",
            "trackercdn.kugou.com",
            "*.kuwo.cn",
            "api-jooxtt.sanook.com",
            "api.joox.com",
            "y.qq.com",
            "*.y.qq.com",
            "streamoc.music.tc.qq.com",
            "mobileoc.music.tc.qq.com",
            "isure.stream.qqmusic.qq.com",
            "dl.stream.qqmusic.qq.com",
            "aqqmusic.tc.qq.com",
            "amobile.music.tc.qq.com",
            "localhost.ptlogin2.qq.com",
            "*.msftconnecttest.com",
            "*.msftncsi.com",
            "*.xiami.com",
            "*.music.migu.cn",
            "music.migu.cn",
            "+.wotgame.cn",
            "+.wggames.cn",
            "+.wowsgame.cn",
            "+.wargaming.net",
            "*.*.*.srv.nintendo.net",
            "*.*.stun.playstation.net",
            "xbox.*.*.microsoft.com",
            "*.*.xboxlive.com",
            "*.ipv6.microsoft.com",
            "teredo.*.*.*",
            "teredo.*.*",
            "speedtest.cros.wr.pvp.net",
            "+.jjvip8.com",
            "www.douyu.com",
            "activityapi.huya.com",
            "activityapi.huya.com.w.cdngslb.com",
            "www.bilibili.com",
            "api.bilibili.com",
            "a.w.bilicdn1.com"
        ],
        "default-nameserver": ["119.29.29.29", "233.5.5.5",],
        "nameserver": ["https://8.8.8.8/dns-query#PROXY&ecs=120.76.0.0/14&ecs-override=true", "https://1.1.1.1/dns-query"],
        "proxy-server-nameserver": ["https://dns.alidns.com/dns-query"],
        "direct-nameserver": ["https://doh.pub/dns-query", "https://dns.alidns.com/dns-query"],
    };

    // 3. 代理组构建逻辑
    const allProxies = params.proxies.map(p => p.name);
    const testUrl = "https://cp.cloudflare.com";

    // 存储识别到的有效地区组名
    const validRegionGroups = [];
    const regionProxyGroups = []; // 存放所有生成的地区相关组

    // --- 识别节点并生成地区组 ---
    const otherNodes = [...allProxies];

    regionConfigs.forEach(r => {
        const matched = allProxies.filter(p => r.regex.test(p));
        if (matched.length > 0) {
            const autoName = `⚡ ${r.name} - 自动选择`;
            const fallbackName = `🛡️ ${r.name} - 故障转移`;
            const manualName = r.icon + ` ${r.name}`;

            // 自动组 (隐藏)
            regionProxyGroups.push({
                name: autoName,
                type: "url-test",
                proxies: matched,
                url: testUrl,
                interval: 300,
                hidden: true
            });

            // 故障转移组 (隐藏)
            regionProxyGroups.push({
                name: fallbackName,
                type: "fallback",
                proxies: matched,
                url: testUrl,
                interval: 300,
                hidden: true
            });

            // 手动选择组 (显示)
            regionProxyGroups.push({
                name: manualName,
                type: "select",
                proxies: [autoName, fallbackName, ...matched],
                icon: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/icon/color/" + r.key.toLowerCase() + ".png",
            });

            validRegionGroups.push(manualName);
            // 从“其他”节点中移除已匹配节点
            matched.forEach(m => {
                const idx = otherNodes.indexOf(m);
                if (idx > -1) otherNodes.splice(idx, 1);
            });
        }
    });

    // 处理其他地区
    if (otherNodes.length > 0) {
        regionProxyGroups.push({
            name: "🌐 其他地区",
            type: "select",
            proxies: otherNodes,
            icon: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/icon/color/global.png"
        });
        validRegionGroups.push("🌐 其他地区");
    }

    // --- 构建顶级代理组 ---
    const topGroups = [
        {
            name: "🎯 节点选择",
            type: "select",
            proxies: [...validRegionGroups, "DIRECT"],
            icon: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/icon/color/available.png",
        }
    ];

    // --- 构建平台分流组 (安全引用：只引用存在的地区组) ---
    const getProxiesFor = (preferredNames) => {
        const available = validRegionGroups.filter(v => preferredNames.some(p => v.includes(p)));
        return available.length > 0 ? [...available, "🎯 节点选择"] : ["🎯 节点选择", "DIRECT"];
    };

    const platformGroups = [
        { name: "🤖 智能AI", type: "select", proxies: getProxiesFor(["美国", "新加坡", "日本", "英国"]) },
        { name: "📺 哔哩哔哩", type: "select", proxies: ["DIRECT", ...getProxiesFor(["香港", "台湾", "澳门"])] },
        { name: "🔍 必应搜索", type: "select", proxies: getProxiesFor(["美国", "新加坡", "日本"]) },
        { name: "Ⓜ️ 微软服务", type: "select", proxies: ["DIRECT", "🎯 节点选择"] },
        { name: "Google", type: "select", proxies: ["🎯 节点选择", ...validRegionGroups] },
        { name: "Apple", type: "select", proxies: ["DIRECT", "🎯 节点选择"] },
        { name: "广告拦截", type: "select", proxies: ["REJECT", "DIRECT"] },
        { name: "🐟 漏网之鱼", type: "select", proxies: ["🎯 节点选择", "DIRECT"] }
    ];

    // 组合代理组：基础选择 -> 地区手动组 -> 平台组
    // 注意：被引用的组（自动/故障转移）已经在 regionProxyGroups 里
    params["proxy-groups"] = [...topGroups, ...regionProxyGroups, ...platformGroups];

    // 4. Rule Providers (Blackmatrix7)
    const baseProvider = { type: "http", interval: 86400, format: "text", proxy: "🎯 节点选择" };
    params["rule-providers"] = {
        "bilibili": { ...baseProvider, behavior: "classical", url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/BiliBili/BiliBili.list" },
        "openai": { ...baseProvider, behavior: "classical", url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/OpenAI/OpenAI.list" },
        "gemini": { ...baseProvider, behavior: "classical", url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Gemini/Gemini.list" },
        "claude": { ...baseProvider, behavior: "classical", url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Claude/Claude.list" },
        "bing": { ...baseProvider, behavior: "classical", url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Bing/Bing.list" },
        "microsoft": { ...baseProvider, behavior: "classical", url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Microsoft/Microsoft.list" },
        "google": { ...baseProvider, behavior: "classical", url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Google/Google.list" },
        "apple": { ...baseProvider, behavior: "classical", url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Apple/Apple.list" },
        "china_domain": { ...baseProvider, behavior: "domain", url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/China/China_Domain.txt" },
        "china_ip": { ...baseProvider, behavior: "ipcidr", url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/ChinaIPsBGP/ChinaIPsBGP_IP.txt" },
        "china": { ...baseProvider, format: "yaml", behavior: "classical", url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/China/China.yaml" },
        "advertising": { ...baseProvider, behavior: "classical", format: "yaml", url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/AdvertisingLite/AdvertisingLite.yaml" },
        "advertising_domain": { ...baseProvider, behavior: "domain", url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/AdvertisingLite/AdvertisingLite_Domain.txt" },
        "lan": { ...baseProvider, behavior: "classical", url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Lan/Lan.list" },
    };

    // 5. 规则覆写
    params.rules = [
        "RULE-SET,advertising,广告拦截",
        "RULE-SET,advertising_domain,广告拦截",
        "RULE-SET,lan,DIRECT",
        "RULE-SET,openai,🤖 智能AI",
        "RULE-SET,gemini,🤖 智能AI",
        "RULE-SET,claude,🤖 智能AI",
        "RULE-SET,bilibili,📺 哔哩哔哩",
        "RULE-SET,bing,🔍 必应搜索",
        "RULE-SET,microsoft,Ⓜ️ 微软服务",
        "RULE-SET,google,Google",
        "RULE-SET,apple,Apple",
        "RULE-SET,china_domain,DIRECT",
        "RULE-SET,china_ip,DIRECT",
        "RULE-SET,china,DIRECT",
        "GEOIP,CN,DIRECT",
        "MATCH,🐟 漏网之鱼"
    ];

    return params;
}
