const express = require('express');
const xlsx = require('xlsx');
const path = require('path');
const app = express();

// 1. 基础配置
app.use(express.json());
app.use(express.static('public')); // 存放前端 HTML 文件的文件夹

// 2. 加载物流数据库 (Excel)
// 确保该文件已上传到 GitHub，并与 server.js 在同一目录
const DB_FILE = 'CE中柬空运货物分类_Agent训练版.xlsx';

function loadLogisticsData() {
    try {
        const workbook = xlsx.readFile(DB_FILE);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        return xlsx.utils.sheet_to_json(worksheet);
    } catch (error) {
        console.error("数据库加载失败，请检查文件是否存在:", error);
        return [];
    }
}

const logisticsData = loadLogisticsData();

// 3. 核心接口：给远方用户查询价格和分类
app.post('/api/search', (req, res) => {
    const { itemName } = req.body;
    
    if (!itemName) {
        return res.json({ success: false, message: "请输入物品名称" });
    }

    // 在 Excel 数据中进行模糊匹配
    const result = logisticsData.find(item => 
        String(item.货物名称).includes(itemName) || itemName.includes(String(item.货物名称))
    );

    if (result) {
        res.json({
            success: true,
            data: {
                name: result.货物名称,
                type: result.货物属性,
                price: result.运费参考,
                status: result.运输状态,
                note: result.备注 || "无额外要求"
            }
        });
    } else {
        res.json({ success: false, message: "❌ 数据库未收录此物品，请咨询人工客服。" });
    }
});

// 4. 你的原有的扫码装车逻辑（示例）
app.post('/api/scan', (req, res) => {
    const { barcode } = req.body;
    console.log(`收到扫描请求: ${barcode}`);
    // 这里写你之前的数据库保存逻辑
    res.json({ success: true, msg: "扫描成功" });
});

// 5. 关键：云服务器端口自适应
// 云平台（如 Render）会通过 process.env.PORT 自动分配端口
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`-----------------------------------------`);
    console.log(`🚀 CE 物流系统已在云端启动！`);
    console.log(`📡 监听端口: ${PORT}`);
    console.log(`🔗 本地访问: http://localhost:${PORT}`);
    console.log(`-----------------------------------------`);
});