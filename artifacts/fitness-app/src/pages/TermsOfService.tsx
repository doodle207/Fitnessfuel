import { ArrowLeft, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function TermsOfService() {
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
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Terms of Service</h1>
              <p className="text-white/40 text-sm">Last updated: March 2026</p>
            </div>
          </div>

          <div className="mt-8 space-y-8 text-white/70 text-sm leading-relaxed">
            <section>
              <h2 className="text-white font-semibold text-base mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using CaloForgeX ("the Service," "the App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service. These Terms constitute a legally binding agreement between you and CaloForgeX.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">2. Description of Service</h2>
              <p>
                CaloForgeX is a fitness and nutrition companion application that provides calorie and macro tracking, AI-powered coaching and food scanning, workout planning and logging, progress monitoring, and personalised health recommendations. The Service is provided "as is" and may be updated, modified, or discontinued at our discretion.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">3. Eligibility</h2>
              <p>
                You must be at least 16 years of age to use the Service. By creating an account, you represent and warrant that you meet this age requirement. If you are under 18, you confirm that you have obtained parental or guardian consent to use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">4. Account Registration</h2>
              <p className="mb-3">
                You must create an account to access most features of the Service. You agree to:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Provide accurate, complete, and current registration information.</li>
                <li>Maintain the security of your account credentials and not share them with others.</li>
                <li>Notify us immediately of any unauthorised use of your account.</li>
                <li>Accept responsibility for all activities that occur under your account.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">5. Subscription Plans & Payments</h2>
              <p className="mb-3">
                CaloForgeX offers both a free tier and paid subscription plans (Premium and Pro). By subscribing:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Payments are processed securely through Razorpay. Indian users are billed in INR; international users are billed in USD.</li>
                <li>Subscriptions are for a fixed term (30 days) and do not automatically renew unless explicitly stated.</li>
                <li>Prices are displayed at checkout and are subject to change with notice.</li>
                <li>All payments are final. Refunds are issued at our sole discretion, typically only in cases of technical failure on our end.</li>
                <li>Promotional coupon codes grant free Premium access for a limited period and cannot be combined with paid plans.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">6. Health Disclaimer</h2>
              <p>
                CaloForgeX is a general wellness and fitness tracking tool. The information, AI recommendations, meal plans, and coaching provided by the Service are for informational and educational purposes only. They are not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before making significant changes to your diet, exercise routine, or health regimen, especially if you have a pre-existing medical condition.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">7. Acceptable Use</h2>
              <p className="mb-3">You agree not to:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Use the Service for any unlawful purpose or in violation of applicable laws.</li>
                <li>Attempt to reverse-engineer, decompile, or disassemble any part of the Service.</li>
                <li>Access the Service through automated means (bots, scrapers) without our prior written permission.</li>
                <li>Upload or transmit malicious code, viruses, or harmful content.</li>
                <li>Impersonate any person or entity or misrepresent your affiliation.</li>
                <li>Exploit or abuse AI features to generate harmful, misleading, or illegal content.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">8. Intellectual Property</h2>
              <p>
                All content, features, branding, and functionality of CaloForgeX — including but not limited to text, graphics, logos, icons, and software — are the exclusive property of CaloForgeX and are protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written consent.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">9. User Content</h2>
              <p>
                You retain ownership of data you input into the Service (e.g., food logs, workout entries). By submitting content, you grant us a limited, non-exclusive licence to process and store that data to provide the Service. We do not claim ownership of your personal health data.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">10. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by applicable law, CaloForgeX shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data, profits, or goodwill, arising from your use of or inability to use the Service. Our total liability to you for any claims arising under these Terms shall not exceed the amount you paid us in the 3 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">11. Disclaimers</h2>
              <p>
                The Service is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components. AI-generated recommendations may contain errors and should not be relied upon as professional advice.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">12. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account at our discretion if you violate these Terms or engage in conduct we deem harmful to the Service or other users. You may terminate your account at any time by contacting us. Upon termination, your right to use the Service ceases immediately.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">13. Changes to Terms</h2>
              <p>
                We may modify these Terms at any time. We will provide notice of material changes by updating the "Last updated" date and, where appropriate, by email notification. Your continued use of the Service after the effective date of changes constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">14. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising out of or relating to these Terms shall be subject to binding arbitration or the courts of competent jurisdiction in the region where CaloForgeX operates.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">15. Contact Us</h2>
              <p>
                If you have questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-white font-medium">CaloForgeX Legal Team</p>
                <p className="text-violet-400 mt-1">legal@caloforgex.com</p>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
