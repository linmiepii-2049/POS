# LINE Pay 集成故障排除

## 常见错误：400 Bad Request

### 1. 检查环境变量配置

**问题**：`wrangler.toml` 中的 LINE Pay 配置未正确设置

**解决方法**：
1. 打开 `packages/backend/wrangler.toml`
2. 检查以下配置是否正确：
   ```toml
   LINE_PAY_CHANNEL_ID = "YOUR_SANDBOX_CHANNEL_ID"  # 必须替换为实际值
   LINE_PAY_CHANNEL_SECRET = "YOUR_SANDBOX_CHANNEL_SECRET"  # 必须替换为实际值
   ```
3. 如果仍然是占位符，请：
   - 登录 https://pay.line.me
   - 前往「管理付款連結」>「管理連結金鑰」
   - 获取 Channel ID 和 Channel Secret
   - 更新 `wrangler.toml` 中的值

### 2. 检查请求数据格式

**问题**：前端发送的数据格式不符合后端期望

**检查点**：
- `campaignId` 必须是正整数
- `productId` 必须是正整数
- `quantity` 必须是正整数
- `pickupDate` 必须是字符串（格式：YYYY-MM-DD）

**调试方法**：
在浏览器控制台查看 Network 标签，检查：
1. 请求 URL：`http://localhost:8787/api/preorders/payment/request`
2. 请求方法：`POST`
3. 请求体（Request Payload）：
   ```json
   {
     "campaignId": 1,
     "productId": 1,
     "quantity": 1,
     "pickupDate": "2024-12-01"
   }
   ```

### 3. 检查后端日志

**查看后端控制台输出**：
- 如果看到 "LINE Pay Channel ID 未配置" 或 "LINE Pay Channel Secret 未配置"
  → 说明环境变量未正确设置
- 如果看到 "收到支付請求" 但后续出错
  → 可能是 LINE Pay API 调用失败

### 4. 常见错误信息对照

| 错误信息 | 原因 | 解决方法 |
|---------|------|---------|
| `請求參數驗證失敗` | Zod 验证失败 | 检查请求数据格式和类型 |
| `LINE Pay Channel ID 未配置` | 环境变量未设置 | 更新 `wrangler.toml` |
| `商品不存在於此預購檔期` | 商品 ID 或档期 ID 错误 | 检查商品和档期是否存在 |
| `預購數量不足` | 购买数量超过剩余数量 | 减少购买数量 |

### 5. 快速诊断步骤

1. **检查环境变量**：
   ```bash
   cd packages/backend
   # 查看 wrangler.toml 中的 LINE_PAY_* 配置
   grep LINE_PAY wrangler.toml
   ```

2. **检查后端是否运行**：
   ```bash
   curl http://localhost:8787/health
   ```

3. **测试支付 API（需要有效的 Channel ID/Secret）**：
   ```bash
   curl -X POST http://localhost:8787/api/preorders/payment/request \
     -H "Content-Type: application/json" \
     -d '{
       "campaignId": 1,
       "productId": 1,
       "quantity": 1,
       "pickupDate": "2024-12-01"
     }'
   ```

4. **查看详细错误**：
   - 打开浏览器开发者工具
   - 查看 Network 标签
   - 点击失败的请求
   - 查看 Response 标签中的错误详情

### 6. 如果仍然无法解决

1. **检查后端控制台**：
   - 查看是否有 Zod 验证错误详情
   - 查看是否有 LINE Pay API 调用错误

2. **检查前端控制台**：
   - 查看是否有 JavaScript 错误
   - 查看 Network 请求的详细信息

3. **验证数据**：
   - 确认有活动的预购档期
   - 确认商品有剩余数量
   - 确认取货日期格式正确

## 下一步

如果问题仍然存在，请提供：
1. 浏览器控制台的完整错误信息
2. 后端控制台的日志输出
3. Network 标签中请求和响应的详细信息

