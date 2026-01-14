import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Target, ArrowLeft, Shield, Eye, Lock, UserCheck, Database, Bell, Mail } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Goal Achiever Pro',
  description: 'Learn how Goal Achiever Pro collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 font-semibold group">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <Target className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">Goal Achiever Pro</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="container max-w-4xl py-16 px-4">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: January 13, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <div className="bg-muted/30 rounded-xl p-6 mb-8 border">
            <p className="text-sm text-muted-foreground m-0">
              Goal Achiever Pro is committed to protecting your privacy. This Privacy Policy explains
              how we collect, use, disclose, and safeguard your information when you use our application.
            </p>
          </div>

          <Section icon={Eye} title="Information We Collect">
            <p>We collect information you provide directly to us, including:</p>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, and password when you create an account</li>
              <li><strong>Profile Data:</strong> Goals, visions, time tracking data, and other content you create</li>
              <li><strong>Payment Information:</strong> Billing details processed securely through Stripe</li>
              <li><strong>Communications:</strong> Messages you send to us for support or feedback</li>
            </ul>
            <p>We automatically collect certain information when you use our service:</p>
            <ul>
              <li>Device information and browser type</li>
              <li>IP address and general location</li>
              <li>Usage data and interaction patterns</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </Section>

          <Section icon={Database} title="How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent fraudulent transactions</li>
              <li>Personalize and improve your experience</li>
            </ul>
          </Section>

          <Section icon={UserCheck} title="Information Sharing">
            <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
            <ul>
              <li><strong>Service Providers:</strong> With vendors who assist in providing our services (e.g., payment processing, hosting)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to respond to legal process</li>
              <li><strong>Safety:</strong> To protect the rights, property, or safety of Goal Achiever Pro, our users, or others</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </Section>

          <Section icon={Lock} title="Data Security">
            <p>We implement appropriate technical and organizational measures to protect your personal information, including:</p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication requirements</li>
              <li>Secure hosting on enterprise-grade infrastructure</li>
            </ul>
            <p>However, no method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.</p>
          </Section>

          <Section icon={Bell} title="Your Rights and Choices">
            <p>You have certain rights regarding your personal information:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Export:</strong> Download your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
            <p>To exercise these rights, contact us at privacy@goalachiever.pro</p>
          </Section>

          <Section icon={Mail} title="Contact Us">
            <p>If you have questions about this Privacy Policy or our privacy practices, please contact us:</p>
            <ul>
              <li>Email: privacy@goalachiever.pro</li>
              <li>Through our <Link href="/contact" className="text-primary hover:underline">Contact Page</Link></li>
            </ul>
          </Section>

          <div className="bg-muted/30 rounded-xl p-6 mt-8 border">
            <h3 className="font-display font-semibold mb-2 mt-0">Changes to This Policy</h3>
            <p className="text-sm text-muted-foreground m-0">
              We may update this Privacy Policy from time to time. We will notify you of any changes by
              posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-8">
        <div className="container px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <Target className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-sm">Goal Achiever Pro</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Goal Achiever Pro. All rights reserved.
          </p>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors text-foreground font-medium">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="font-display text-xl font-semibold m-0">{title}</h2>
      </div>
      {children}
    </section>
  );
}
