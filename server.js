import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 修正 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// 靜態圖檔：連到 public/logos（注意是上一層的 public）
app.use('/logos', express.static(path.join(__dirname, '..', 'public', 'logos')));

// ✅ 正確路徑：指向 public/data 底下的 json 檔案
const matchesFilePath = path.join(__dirname, 'data.json');
const teamsFilePath = path.join(__dirname, 'teams.json');


// 讀寫工具
const readJson = (filepath) => {
  try {
    const data = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`讀取 ${filepath} 失敗：`, err);
    return [];
  }
};
const writeJson = (filepath, data) => {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
};

// 取得所有比賽資料
app.get('/api/matches', (req, res) => {
  const matches = readJson(matchesFilePath);
  const teams = readJson(teamsFilePath);

  const enriched = matches.map(match => {
    const home = teams.find(t => t.id === match.homeId);
    const away = teams.find(t => t.id === match.awayId);
    return {
      ...match,
      home: home ? { ...home, logo: `/logos/${home.logo}` } : null,
      away: away ? { ...away, logo: `/logos/${away.logo}` } : null,
    };
  });

  res.json(enriched);
});

// 取得所有隊伍資料
app.get('/api/teams', (req, res) => {
  const teams = readJson(teamsFilePath).map(team => ({
    ...team,
    logo: `/logos/${team.logo}`
  }));
  res.json(teams);
});

// 新增比賽
app.post('/api/matches', (req, res) => {
  const matches = readJson(matchesFilePath);
  const newMatch = { ...req.body, id: matches.length + 1 };
  matches.push(newMatch);
  writeJson(matchesFilePath, matches);
  res.status(201).json(newMatch);
});

// 刪除比賽
app.delete('/api/matches/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let matches = readJson(matchesFilePath);
  const filtered = matches.filter(m => m.id !== id);
  if (matches.length === filtered.length) {
    return res.status(404).send("找不到比賽");
  }
  writeJson(matchesFilePath, filtered);
  res.sendStatus(204);
});

// 更新比分
app.patch('/api/matches/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const matches = readJson(matchesFilePath);
  const match = matches.find(m => m.id === id);
  if (!match) return res.status(404).send("Match not found");
  match.score = req.body.score;
  writeJson(matchesFilePath, matches);
  res.json(match);
});

// 新增隊伍
app.post('/api/teams', (req, res) => {
  const teams = readJson(teamsFilePath);
  const newTeam = { id: teams.length + 1, ...req.body };
  teams.push(newTeam);
  writeJson(teamsFilePath, teams);
  res.status(201).json(newTeam);
});

// 啟動伺服器
app.listen(port, () => {
  console.log(`✅ 伺服器運行中：http://localhost:${port}`);
});
