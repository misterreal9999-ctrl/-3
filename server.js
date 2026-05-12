const express = require('express');
const xlsx = require('xlsx');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname)); // 允许访问根目录下的 index.html

// 数据库加载
const DB_FILE = 'CE中柬空运货物分类_Agent训练版.xlsx';
let logisticsData = [];

function loadData() {
    try {
        const workbook = xlsx.readFile(DB_FILE);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        logisticsData = xlsx.utils.sheet_to_json(sheet);
        console.log(`✅ 成功加载 ${logisticsData.length} 条物流数据`);
    } catch (e) {
        console.error("❌ 数据库加载失败，请检查文件名:", e.message);
    }
}
loadData();

// 接口：自动补全建议 (YouTube 风格)
app.get('/api/suggest', (req, res) => {
    const keyword = (req.query.keyword || '').trim();
    if (!keyword) return res.json([]);

    const suggestions = logisticsData
        .filter(item => String(item.货物名称).includes(keyword))
        .map(item => item.货物名称)
        .slice(0, 8); // 返回前8个最相关的词

    res.json(suggestions);
});

// 接口：执行查询
app.post('/api/search', (req, res) => {
    const { itemName } = req.body;
    // 优先匹配完全一致的名称
    const found = logisticsData.find(item => String(item.货物名称) === itemName);

    if (found) {
        res.json({
            success: true,
            data: {
                name: found.货物名称,
                type: found.货物属性,
                price: found.运费参考,
                status: found.运输状态,
                note: found.备注 || "暂无特别备注"
            }
        });
    } else {
        res.json({ success: false, message: "❌ 数据库中未找到该品名" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CE Logistics Agent 正在端口 ${PORT} 上运行`);
});