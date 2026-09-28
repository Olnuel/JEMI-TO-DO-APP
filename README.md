# 🎀 Chérie — Aesthetic To-Do, Habits & Daily Glow Planner ✨

> *A chic, coquette, and feature-packed lifestyle to-do application crafted with pastel elegance, smooth animations, soothing sound effects, and celebratory sparkles.*

---

## 🌸 Live Features & Highlights

### 🎀 1. Sparkling Task Management
- **Full CRUD Operations**: Create, view, edit, duplicate, and delete tasks.
- **Cute Bow Checkboxes**: Smooth check animation with fairy chimes and celebratory confetti.
- **Pinned Tasks**: Pin priority tasks to the top with a sparkling ribbon ⭐.
- **Interactive Checklists & Subtasks**: Track nested action items with live percentage completion bars.
- **Aesthetic Categories**:
  - 🌸 Daily Routine
  - 💄 Self-Care & Glam
  - 📚 Smart Girl Era (Study & Skills)
  - 💼 Girl Boss Moves (Work & Projects)
  - 🛍️ Pink Wishlist (Shopping & Style)
  - ✈️ Dream Destinations (Travel)
- **Priorities with Vibe Tags**:
  - 🔥 *Urgent & Glam*
  - 🎀 *Cute & Important*
  - ☁️ *Soft & Flexible*
  - 💤 *Chill Vibe*
- **Energy Level Filter**:
  - ⚡ *High Energy (Girl Boss)*
  - 🌸 *Medium Energy (Flow State)*
  - 🧋 *Low Energy (Cozy & Gentle)*
- **Smart Dates**: Relative deadlines (Today, Tomorrow, Overdue highlights).
- **Search, Multi-Filter & Sorting**: Search by keyword or tag (`#skincare`, `#matcha`), filter by status, priority, or energy level, and sort smartly.

### 💧 2. Daily Glow Hydration & Habit Streaks
- **8 Cups Water Tracker**: Interactive pastel glass cups with water drops and fill sound effects.
- **Goal Celebration**: Reaching 8 cups triggers a reward chime, confetti burst, and **+25 Petals**!
- **Daily Glow Habits**: Check off daily routines (Skincare, Gua Sha, Reading, Pilates) with consecutive fire streaks (`🔥 7d`).
- Add and delete custom habits with custom cute emojis.

### 🫖 3. Focus Tea Room (Aesthetic Pomodoro)
- **3 Modes**:
  - 🌸 *25 min Glow Focus*
  - 🍓 *5 min Strawberry Break*
  - 💅 *15 min Beauty Rest*
- **Synthesized Ambient Noise**: Built-in soothing cozy rain sound generator powered directly by the Web Audio API (zero external asset loading, 100% offline).
- **Circular Animated Ring**: Smooth SVG progress countdown with tea cup and strawberry breathers.
- **Session Rewards**: Earn **+20 Petals** per completed focus session!

### 🧸 4. Digital Sticker Book & Mood Board
- **Collectible Stickers**: Earn Petals from tasks, habits, and focus sessions to unlock satin bows, ballet shoes, strawberry tarts, Chanel gloss, tiaras, and golden hearts.
- **Interactive Mood Canvas**: Tap any unlocked sticker to stamp and arrange it on your aesthetic collage board!

### 🎨 5. 6 Girly Aesthetic Themes (Toggleable)
1. 🎀 **Coquette Dream**: Soft baby pink, silk ribbons, pearls, and rosewater.
2. 🌸 **Sakura Petal**: Cherry blossoms, matcha green accents, and ivory cream.
3. 💜 **Kawaii Lavender**: Lilac haze, periwinkle, and marshmallow white.
4. 🍓 **Strawberry Shortcake**: Sweet berry red accents and whipped cream.
5. ☕ **Vanilla Clean Girl**: Cashmere, warm latte, and minimalist gold touches.
6. ✨ **Midnight Princess**: Twilight starry plum with neon pink sparkles.

### 📔 6. Pink Scratchpad & Affirmations
- **Brain Dump Drawer**: Quick-access lined notepad for sudden ideas, aesthetic wishlists, and journal thoughts.
- **Daily Affirmations Banner**: Uplifting affirmations with refresh button and daily mood check-in pills.

### 🔊 7. Self-Contained Web Audio Synthesizer
- Built with standard Web Audio API oscillators and filters:
  - Cute bubble pops for buttons and checklists
  - Fairy chimes for completions
  - Liquid water drops for hydration
  - Ambient soft rain for focus sessions
  - Mute/Unmute toggle preserved in memory

---

## 🚀 How to Run Locally

```bash
# Navigate to the folder
cd C:\Users\HP\.gemini\antigravity\scratch\girly-todo-app

# Install dependencies (already installed)
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## ☁️ How to Deploy to Vercel

### Option 1: Deploy with Vercel CLI (Fastest)

1. Open PowerShell in `C:\Users\HP\.gemini\antigravity\scratch\girly-todo-app`.
2. Run:
   ```bash
   npx vercel
   ```
3. When prompted:
   - Log in using your browser, GitHub, or email.
   - Confirm project settings by pressing **Enter** for the defaults.
4. For production deployment:
   ```bash
   npx vercel --prod
   ```

### Option 2: Deploy with Vercel Token (Instant headless deploy)

If you have a Vercel personal access token:
```bash
npx vercel --token <YOUR_VERCEL_TOKEN> --prod --yes
```

### Option 3: Deploy via GitHub (Recommended for automatic updates)

1. Create a new repository on [GitHub](https://github.com/new) called `girly-todo-app`.
2. Link and push your code:
   ```bash
   git remote add origin https://github.com/<your-username>/girly-todo-app.git
   git branch -M main
   git push -u origin main
   ```
3. Go to [vercel.com/new](https://vercel.com/new), select your `girly-todo-app` repository, and click **Deploy**!
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
