import { useLocation } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 pb-16">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
              <p className="text-white/40 text-sm">Last updated: March 2026</p>
            </div>
          </div>

          <div className="mt-8 space-y-8 text-white/70 text-sm leading-relaxed">
            <section>
              <h2 className="text-white font-semibold text-base mb-3">1. Introduction</h2>
              <p>
                Welcome to CaloForgeX ("we," "our," or "us"). CaloForgeX is a fitness and nutrition tracking application. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service. Please read this policy carefully. If you disagree with its terms, please discontinue use of the application.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">2. Information We Collect</h2>
              <p className="mb-3">We may collect the following types of information:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li><span className="text-white/90 font-medium">Account Information:</span> Email address, name, and authentication credentials you provide when creating an account.</li>
                <li><span className="text-white/90 font-medium">Profile & Health Data:</span> Age, gender, height, weight, fitness goals, activity level, and dietary preferences you enter during onboarding or profile setup.</li>
                <li><span className="text-white/90 font-medium">Usage Data:</span> Workout logs, calorie and nutrition entries, progress photos, hydration data, and step counts you record in the app.</li>
                <li><span className="text-white/90 font-medium">Payment Information:</span> Billing details processed securely through Razorpay. We do not store your full card number or banking credentials.</li>
                <li><span className="text-white/90 font-medium">Device & Technical Data:</span> IP address, browser type, device identifiers, and app usage analytics to improve our service.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">3. How We Use Your Information</h2>
              <p className="mb-3">We use your information to:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Create and manage your account and provide our core fitness tracking services.</li>
                <li>Calculate personalised calorie targets, macronutrient recommendations, and workout plans.</li>
                <li>Power AI-based coaching, food scanning, and meal plan generation features.</li>
                <li>Process payments and manage subscription plans.</li>
                <li>Send transactional emails such as OTP verification codes.</li>
                <li>Improve the app through anonymised usage analytics.</li>
                <li>Respond to support requests and resolve disputes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">4. Sharing Your Information</h2>
              <p className="mb-3">We do not sell your personal data. We may share information with:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li><span className="text-white/90 font-medium">Service Providers:</span> Third-party vendors (e.g., Razorpay for payments, Resend for email delivery, OpenAI for AI features) who process data on our behalf under strict confidentiality agreements.</li>
                <li><span className="text-white/90 font-medium">Legal Requirements:</span> When required by applicable law, court order, or government authority.</li>
                <li><span className="text-white/90 font-medium">Business Transfers:</span> In connection with a merger, acquisition, or sale of all or substantially all of our assets.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">5. Data Retention</h2>
              <p>
                We retain your personal data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us. Some data may be retained for legal or financial record-keeping obligations.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">6. Data Security</h2>
              <p>
                We implement industry-standard security measures including encryption in transit (HTTPS/TLS), hashed passwords, and secure session management to protect your data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">7. Health Data</h2>
              <p>
                Health and fitness data you enter (such as weight, diet, menstrual cycle information) is sensitive. We treat this data with extra care, use it solely to provide the services you request, and do not share it with advertisers or third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">8. Your Rights</h2>
              <p className="mb-3">Depending on your location, you may have the right to:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Access a copy of the personal data we hold about you.</li>
                <li>Correct inaccurate or incomplete data.</li>
                <li>Request deletion of your personal data ("right to be forgotten").</li>
                <li>Object to or restrict certain processing of your data.</li>
                <li>Data portability — receive your data in a structured, machine-readable format.</li>
              </ul>
              <p className="mt-3">To exercise these rights, contact us at <span className="text-violet-400">privacy@caloforgex.com</span>.</p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">9. Cookies & Tracking</h2>
              <p>
                We use session cookies to keep you logged in and store your preferences (such as language selection). We do not use third-party advertising cookies or tracking pixels for ad targeting.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">10. Children's Privacy</h2>
              <p>
                CaloForgeX is not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the "Last updated" date above and, where appropriate, by sending an email notification. Your continued use of the app after changes constitutes acceptance of the revised policy.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">12. Contact Us</h2>
              <p>
                If you have questions or concerns about this Privacy Policy, please contact us at:
              </p>
              <div className="mt-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-white font-medium">CaloForgeX Privacy Team</p>
                <p className="text-violet-400 mt-1">privacy@caloforgex.com</p>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
