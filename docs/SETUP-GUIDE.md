# Group 7 Pipeline: Simple Setup Guide

Anyone in the group can follow this. No coding needed. About **60 to 90 minutes**.
Take a screenshot at every 📸. We need them for the slides and the report.

**What we are building**

| Server | What it is |
|---|---|
| 1. Code Repository | Our GitHub repo |
| 2. CI/Build | GitHub Actions (GitHub runs it for us) |
| 3. Test/Staging | AWS EC2 server `g07-staging` |
| 4. Production | AWS EC2 server `g07-production` (with Grafana monitoring) |

**You need:** a GitHub account, AWS access (Learner Lab or own account), and the file `todo-devops.zip`.

---

## Step 1. Put the code on GitHub (10 min)

1. Unzip `todo-devops.zip`. You get a folder called `todo-devops`.
2. Install **GitHub Desktop**: https://desktop.github.com. Sign in with your GitHub account.
3. In GitHub Desktop click **File → Add local repository → Choose...** and pick the `todo-devops` folder. Click **Add repository**.
4. Click **Publish repository** (top bar).
   - **Untick** "Keep this code private". It must be public for the approval button to work for free.
   - Click **Publish repository**.
5. Open the repo on github.com. Click **Settings → Collaborators → Add people** and add the other two members.
6. 📸 Screenshot the repo page.

> Two pipelines start. **Quick CI Pipeline** should go green in about 3 min (build + all tests, no AWS needed). **CI-CD Pipeline** will fail. That is normal. The servers do not exist yet.

---

## Step 2. Make 2 servers on AWS (20 min)

### 2a. Key pair (do once)
1. AWS Console → search **EC2** → left menu **Key Pairs** → **Create key pair**.
2. Name `g07-key`, type **RSA**, format **.pem** → **Create key pair**. A file downloads. Keep it.

### 2b. Launch the staging server
1. EC2 → **Instances → Launch instances**.
2. **Name:** `g07-staging`
3. **Application and OS Images:** click **Ubuntu** (Ubuntu Server 24.04 LTS).
4. **Instance type:** `t3.small`
5. **Key pair:** `g07-key`
6. **Network settings:** click **Edit**.
   - Tick **Create security group**. Name it `g07-sg`.
   - The SSH rule (port 22) is already there. Set its Source to **Anywhere**.
   - Click **Add security group rule** 3 times and set:
     - Type **HTTP** → Source **Anywhere**
     - Type **Custom TCP**, Port **3001** → Source **Anywhere** (Grafana)
     - Type **Custom TCP**, Port **9090** → Source **Anywhere** (Prometheus)
7. **Configure storage:** change 8 to **20** GiB.
8. Open **Advanced details** (bottom). Scroll to **User data**. Open `setup/ec2-user-data.sh` from the folder in Notepad, copy all of it and paste it in the box. This installs Docker for you.
9. Click **Launch instance**.

### 2c. Launch the production server
Same as 2b, with 3 changes:
- **Name:** `g07-production`
- **Network settings → Select existing security group →** `g07-sg`
- Storage: **20** GiB, and paste the same **User data**.

### 2d. Write down the IPs
1. Go to **Instances**. Wait until both show **Running** and **2/2 checks passed** (about 3 min).
2. Click each server and copy its **Public IPv4 address**. Write them down:
   - Staging IP: `__________`
   - Production IP: `__________`
3. 📸 Screenshot the Instances list.

> **Learner Lab users:** the IPs change every time the lab restarts. If they change, update the two IP secrets in Step 3.

---

## Step 3. Add 4 secrets to GitHub (5 min)

On github.com, in our repo: **Settings → Secrets and variables → Actions → New repository secret**. Add each one:

| Name | Value |
|---|---|
| `EC2_SSH_KEY` | Open `g07-key.pem` in Notepad. Copy **everything**, including the `-----BEGIN` and `-----END` lines |
| `STAGING_HOST` | Staging IP from Step 2d |
| `PROD_HOST` | Production IP from Step 2d |
| `DB_PASSWORD` | Make one up, letters and numbers only, e.g. `Group7Pass2026`. It is also the Grafana password |

📸 Screenshot the secrets list. Values are hidden, so this is safe.

---

## Step 4. Turn on the approval button (3 min)

1. Repo **Settings → Environments → New environment** → type `production` → **Configure environment**.
2. Tick **Required reviewers**. Add all 3 members. Click **Save protection rules**.
3. 📸 Screenshot this page.

---

## Step 5. Run the pipeline (15 min)

1. Repo **Actions** tab → click **CI-CD Pipeline** (left) → **Run workflow** → green **Run workflow** button.
2. Click the new run to watch it. There are 3 boxes:
   - **Build + unit tests:** about 3 to 5 min.
   - **Staging tests:** about 3 to 5 min the first time.
   - **Production:** this one waits for you. Click **Review deployments** → tick **production** → **Approve and deploy**.
3. When all 3 are green ✅, open in your browser:
   - `http://PRODUCTION-IP`: add a task, click it, refresh. It stays ticked.
   - `http://PRODUCTION-IP/health`: shows `"status":"OK"`.
4. 📸 Screenshot: the green run, the inside of each job (click a job, then open the test step to show the test results), the approval screen, the live site, and `/health`.

If anything is red, click it, copy the red error text and send it to Isath (or paste it to Claude).

---

## Step 6. Monitoring (10 min)

1. Open `http://PRODUCTION-IP:3001`. Log in with **admin** / your `DB_PASSWORD`.
2. **Dashboards → To-Do Production Monitoring.** 📸 Screenshot it.
3. Open `http://PRODUCTION-IP:9090/targets`. All 3 should say **UP**. 📸

**Test the 2 alerts.** In AWS, select `g07-production` → **Connect → EC2 Instance Connect → Connect**. A black terminal opens. Copy and paste:

**Alert 1: high CPU**
```
docker run --rm -d --name s1 alpine sh -c "while :; do :; done"; docker run --rm -d --name s2 alpine sh -c "while :; do :; done"; date
```
Open `http://PRODUCTION-IP:9090/alerts`. Refresh until **HighCPUUsage** is red **FIRING**. Note how many minutes it took. 📸
Then stop it:
```
docker stop s1 s2
```

**Alert 2: app down**
```
docker stop todo-app; date
```
Refresh `/alerts` until **AppDown** is **FIRING**. Note the time. 📸 Then fix it:
```
docker start todo-app
```

---

## Step 7. Five deploys + demo practice (20 min)

1. On github.com, open `public/index.html` → click the ✏️ pencil.
2. Find `Group 7 To-Do List` and change it, e.g. to `Group 7 To-Do List v2`.
3. Click **Commit changes** → **Commit changes**.
4. Go to **Actions**, wait, then **Approve**. Refresh the live site to see the new heading.
5. Do this **5 times** (v2, v3, v4...). That gives us our 5 production deploys.

**Write down for the slides:**

| What | Where to find it | Our number |
|---|---|---|
| Build time | Actions → a run → Summary ("Production image build time") | |
| Push to live time | Time from commit to the production job finishing | |
| Unit test coverage | Build job → "Run unit tests" step → "Statements" | |
| CPU alert time | Step 6 | |
| App down alert time | Step 6 | |
| Number of production deploys | Actions history | |
| Build success rate | Green runs ÷ all runs | |

---

## Live demo script (4 min)

1. Show the live site and its heading.
2. Edit the heading on github.com to `Group 7 - LIVE DEMO` and commit.
3. Show Actions: build and unit tests running.
4. Show staging: integration and E2E tests passing.
5. Click **Approve**.
6. Refresh the live site. The new heading shows. Open `/health`.
7. Show the Grafana dashboard.

Record it once as a backup video (Windows: **Win + Alt + R**).

---

## Plan B (if AWS will not work in time)

The **Quick CI Pipeline** runs on GitHub only. Every push builds the Docker image and runs unit, integration and E2E tests. Use it in the demo to show the build and test stages, and explain that deployment runs in the full CI-CD Pipeline.

## If something goes wrong

| What you see | Fix |
|---|---|
| `Permission denied (publickey)` | `EC2_SSH_KEY` is not copied fully. Paste the whole .pem again, including BEGIN and END lines |
| `Connection timed out` | Wrong IP in the secrets, or the server is stopped. Check Step 2d |
| `docker: command not found` | User data was not pasted. Connect to the server and run: `curl -fsSL https://get.docker.com \| sudo sh && sudo usermod -aG docker ubuntu` then reboot the server |
| `denied` when pushing or pulling images | Repo **Settings → Actions → General → Workflow permissions → Read and write permissions → Save**, then re-run |
| Health check failed | Connect to the server and run `cd ~/todo && docker compose logs app`. Send the output to Isath |
| Grafana dashboard empty | Wait 1 to 2 minutes, then refresh |

## When the unit is over
EC2 → select both servers → **Instance state → Terminate**, so nobody gets charged.

---

## (Optional) Run the app on your own laptop
Install Docker Desktop, open a terminal in the `todo-devops` folder and run `docker compose up --build`. Then open http://localhost:3000.
