'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Target, ArrowLeft, Mail, MessageSquare, HelpCircle, Bug, Sparkles, CheckCircle2, Send } from 'lucide-react';

const contactReasons = [
  {
    icon: HelpCircle,
    title: 'General Support',
    description: 'Get help with using Goal Achiever Pro',
    email: 'support@goalachiever.pro',
  },
  {
    icon: Bug,
    title: 'Report a Bug',
    description: 'Let us know about technical issues',
    email: 'bugs@goalachiever.pro',
  },
  {
    icon: Sparkles,
    title: 'Feature Requests',
    description: 'Share ideas for new features',
    email: 'feedback@goalachiever.pro',
  },
  {
    icon: MessageSquare,
    title: 'Business Inquiries',
    description: 'Partnerships and enterprise plans',
    email: 'business@goalachiever.pro',
  },
];

export default function ContactPage() {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('submitting');

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));

    setFormState('success');
    setFormData({ name: '', email: '', subject: '', message: '' });

    // Reset after showing success
    setTimeout(() => setFormState('idle'), 3000);
  };

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

      <main className="container max-w-6xl py-16 px-4">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight mb-4">
            Get in Touch
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Have a question, feedback, or need support? We&apos;re here to help you achieve your goals.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="font-display">Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and we&apos;ll get back to you within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {formState === 'success' ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground">
                    Thank you for reaching out. We&apos;ll get back to you soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="What is this regarding?"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us how we can help..."
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full btn-lift"
                    size="lg"
                    disabled={formState === 'submitting'}
                  >
                    {formState === 'submitting' ? (
                      <>
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Contact Options */}
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold mb-4">Other Ways to Reach Us</h2>
              <p className="text-muted-foreground mb-6">
                Choose the best way to get in touch based on your needs.
              </p>
            </div>

            <div className="grid gap-4">
              {contactReasons.map((reason) => (
                <Card key={reason.title} className="border-2 hover:border-primary/30 transition-colors">
                  <CardContent className="flex items-start gap-4 pt-6">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <reason.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold mb-1">{reason.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{reason.description}</p>
                      <a
                        href={`mailto:${reason.email}`}
                        className="text-sm text-primary hover:underline font-medium"
                      >
                        {reason.email}
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Response Time */}
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold mb-1">Quick Response Time</h3>
                    <p className="text-sm text-muted-foreground">
                      We typically respond within 24 hours during business days. For urgent issues,
                      please include &quot;URGENT&quot; in your subject line.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors text-foreground font-medium">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
