const express = require('express');
const xlsx = require('xlsx');
const path = require('path');
const app = express();

app.use(express.json());
// 设置当前目录为静态资源目录，这样直接放根目录的 index.html 就能被访问
app.use(express.static(__dirname)); 

// 加载 Excel 数据库
const DB_FILE = 'CE中柬空运货物分类_Agent训练版.xlsx';
let logisticsData = [];

function loadData() {
    try {
        const workbook = xlsx.readFile(DB_FILE);
        logisticsData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        console.log("✅ 物流数据库加载成功，共 " + logisticsData.length + " 条数据");
    } catch (e) {
        console.error("❌ 数据库加载失败:", e.message);
    }
}
loadData();

// 接口 1：YouTube 风格的搜索建议
app.get('/api/suggest', (req, res) => {
    const keyword = req.query.keyword || '';
    if (!keyword) return res.json([]);

    // 筛选匹配的前 8 个名称，反应最快
    const list = logisticsData
        .filter(item => String(item.货物名称).includes(keyword))
        .map(item => item.货物名称)
        .slice(0, 8);
    res.json(list);
});

// 接口 2：点击后的详细查询
app.post('/api/search', (req, res) => {
    const { itemName } = req.body;
    const found = logisticsData.find(item => String(item.货物名称) === itemName);

    if (found) {
        res.json({
            success: true,
            data: {
                name: found.货物名称,
                type: found.货物属性,
                price: found.运费参考,
                status: found.运输状态,
                note: found.备注 || "无"
            }
        });
    } else {
        res.json({ success: false, message: "未找到精确匹配结果" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 服务运行在端口: ${PORT}`);
});