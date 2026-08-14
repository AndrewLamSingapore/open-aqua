# Put Open Aqua 0.3 on your iPhone

This is the shortest safe route. You do not need to install GitHub CLI.

## Part 1 — Make the private cloud database

1. Open **https://supabase.com/dashboard** and create a project named `open-aqua`.
2. Open **SQL Editor** in that project.
3. Open this source file: `supabase/migrations/202608130001_open_aqua_cloud.sql`.
4. Copy all of it into the Supabase SQL Editor and click **Run** once.
5. Open **Authentication → URL Configuration**.
6. Add this redirect URL: `openaqua://**`.
7. Open **Project Settings → API** and copy:
   - Project URL
   - Publishable key (an anon key also works during Supabase's key transition)

Do **not** copy the service-role key into the app or send it to anyone.

## Part 2 — Turn on permanent in-app account deletion

From the terminal inside the `open-aqua` folder (the first command downloads the official Supabase CLI for this task):

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REFERENCE
npx supabase functions deploy delete-account
```

Supabase supplies the protected service-role key to the deployed function. It never enters the iPhone app.

## Part 3 — Test the app before TestFlight

1. Install Node.js 22 LTS from **https://nodejs.org**.
2. Unzip this source package.
3. Open a terminal inside the `open-aqua` folder.
4. Copy `.env.example` to a new file named `.env`.
5. Put your Project URL and Publishable key into `.env`.
6. Run:

```bash
npm install
npm run verify
npx expo start
```

Use Expo Go on an iPhone to open the QR code for a first functional check. The production TestFlight build in Part 5 is the real compiled iOS app.

## Part 4 — Create the Apple and Expo records

1. Join the Apple Developer Program at **https://developer.apple.com/programs/**.
2. In App Store Connect, create an app named **Open Aqua** with bundle ID `com.andrewlamsingapore.openaqua`.
3. Create an Expo account at **https://expo.dev**.
4. In the same terminal, run:

```bash
npm install --global eas-cli
eas login
eas init
```

`eas init` adds the Expo project ID to the app configuration. Keep the GitHub repository, Supabase project, Expo project and Apple app in accounts you own.

## Part 5 — Add the two build settings

Run these commands and paste each value when asked:

```bash
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --environment production --visibility sensitive
```

The publishable key is designed for the client app. Security comes from the database Row Level Security rules installed in Part 1. Never add a service-role key.

## Part 6 — Build and send to TestFlight

```bash
eas build --platform ios --profile production
eas submit --platform ios --latest
```

Follow the prompts to sign into the Apple account that owns Open Aqua. When Apple finishes processing the build:

1. Open **App Store Connect → Open Aqua → TestFlight**.
2. Add yourself as an internal tester.
3. Install Apple's TestFlight app on the iPhone.
4. Open the invitation and install Open Aqua.

## Before inviting anyone else

Test all of these on the real iPhone:

- Create an account and confirm its email.
- Sign in and sign out.
- Add ammonia, nitrite and nitrate manually.
- Turn on Airplane Mode, save another test, then reconnect.
- Confirm the status changes from “Offline · safe on this phone” to “Saved on phone + cloud”.
- Sign in on a second device and confirm that both independent logs remain.
- Send a password-reset email.
- Export the account's tank data and open the JSON file.
- Type `DELETE` in Owner Account and verify permanent account deletion.

If any item fails, do not invite external testers until it is fixed.
