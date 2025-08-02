import { useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <Layout>
            <div className="fade-in max-w-5xl mx-auto">
                {/* Back Button */}
                <Link href="/">
                    <Button variant="ghost" className="mb-6 text-primary hover:text-pinky-dark">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Button>
                </Link>

                <h1 className="font-quicksand font-bold text-3xl md:text-4xl text-primary mb-6">Privacy Policy</h1>

                {/* Effective Date Card */}
                <Card className="bg-pink-50 p-6 mb-8 shadow-lg">
                    <p className="text-gray-600">
                        <strong className="text-pinky-dark">Effective Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br />
                        <strong className="text-pinky-dark">Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </Card>

                {/* Introduction */}
                <Card className="bg-white p-6 mb-6 shadow-lg hover:shadow-xl transition-shadow">
                    <h2 className="font-quicksand font-bold text-2xl text-pinky-dark mb-4">1. Introduction</h2>
                    <p className="text-gray-700 mb-4 leading-relaxed">
                        Welcome to The Pinky Toe ("we," "our," or "us"). We are committed to protecting your privacy and ensuring transparency about how we handle your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website at www.pinkytoe.com (the "Website").
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        By using our Website, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this Privacy Policy, please do not access the Website.
                    </p>
                </Card>

                {/* Information We Collect */}
                <Card className="bg-white p-6 mb-6 shadow-lg hover:shadow-xl transition-shadow">
                    <h2 className="font-quicksand font-bold text-2xl text-pinky-dark mb-4">2. Information We Collect</h2>

                    <div className="bg-pink-50 p-4 rounded-lg mb-4">
                        <h3 className="font-quicksand font-semibold text-xl text-primary mb-3">Information Collected Automatically</h3>
                        <p className="text-gray-700 mb-4">When you visit our Website, we automatically collect certain information about your device, including:</p>
                        <ul className="list-disc pl-6 text-gray-700 space-y-1">
                            <li>IP address</li>
                            <li>Browser type and version</li>
                            <li>Operating system</li>
                            <li>Referring website addresses</li>
                            <li>Pages viewed and time spent on pages</li>
                            <li>Date and time of visits</li>
                            <li>Device information</li>
                        </ul>
                    </div>

                    <div className="bg-pink-50 p-4 rounded-lg mb-4">
                        <h3 className="font-quicksand font-semibold text-xl text-primary mb-3">Cookies and Tracking Technologies</h3>
                        <p className="text-gray-700 mb-4">We use the following types of cookies and tracking technologies:</p>
                        <ul className="list-disc pl-6 text-gray-700 space-y-2">
                            <li><strong className="text-pinky-dark">Essential Cookies:</strong> We use a cookie to remember your sidebar preferences (open/closed state) to enhance your browsing experience.</li>
                            <li><strong className="text-pinky-dark">Analytics and Performance:</strong> We may use Meta Pixel and other analytics tools to understand how visitors interact with our Website and to improve our content and user experience.</li>
                            <li><strong className="text-pinky-dark">Third-Party Services:</strong> Google Fonts may collect certain data when loading fonts on our Website.</li>
                        </ul>
                    </div>

                    <div className="bg-pink-50 p-4 rounded-lg">
                        <h3 className="font-quicksand font-semibold text-xl text-primary mb-3">Information You Provide</h3>
                        <p className="text-gray-700">Currently, we do not collect personal information directly from users as we do not have contact forms, user accounts, or newsletter subscriptions. If you contact us via email (hello@pinkytoe.com), we will collect the information you provide in your correspondence.</p>
                    </div>
                </Card>

                {/* How We Use Your Information */}
                <Card className="bg-white p-6 mb-6 shadow-lg hover:shadow-xl transition-shadow">
                    <h2 className="font-quicksand font-bold text-2xl text-pinky-dark mb-4">3. How We Use Your Information</h2>
                    <p className="text-gray-700 mb-4">We use the collected information for the following purposes:</p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-2">
                        <li>To provide, operate, and maintain our Website</li>
                        <li>To improve, personalize, and expand our Website</li>
                        <li>To understand and analyze how you use our Website</li>
                        <li>To develop new products, services, features, and functionality</li>
                        <li>To monitor and prevent fraud and technical issues</li>
                        <li>To comply with legal obligations</li>
                    </ul>
                </Card>

                {/* Information Sharing and Disclosure */}
                <Card className="bg-white p-6 mb-6 shadow-lg hover:shadow-xl transition-shadow">
                    <h2 className="font-quicksand font-bold text-2xl text-pinky-dark mb-4">4. Information Sharing and Disclosure</h2>
                    <p className="text-gray-700 mb-4">We do not sell, trade, or rent your personal information to third parties. We may share your information in the following situations:</p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-2">
                        <li><strong className="text-pinky-dark">Service Providers:</strong> We may share your information with third-party service providers who perform services on our behalf, such as web hosting, analytics, and content delivery.</li>
                        <li><strong className="text-pinky-dark">Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.</li>
                        <li><strong className="text-pinky-dark">Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
                        <li><strong className="text-pinky-dark">Protection of Rights:</strong> We may disclose information when we believe it is necessary to protect our rights, privacy, safety, or property, or that of others.</li>
                    </ul>
                </Card>

                {/* Data Security */}
                <Card className="bg-white p-6 mb-6 shadow-lg hover:shadow-xl transition-shadow">
                    <h2 className="font-quicksand font-bold text-2xl text-pinky-dark mb-4">5. Data Security</h2>
                    <p className="text-gray-700">
                        We implement appropriate technical and organizational security measures to protect your personal information against accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or access. However, please note that no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                    </p>
                </Card>

                {/* Data Retention */}
                <Card className="bg-white p-6 mb-6 shadow-lg hover:shadow-xl transition-shadow">
                    <h2 className="font-quicksand font-bold text-2xl text-pinky-dark mb-4">6. Data Retention</h2>
                    <p className="text-gray-700">
                        We retain automatically collected information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Cookie data is retained according to the specific cookie's expiration period (our sidebar preference cookie expires after 7 days).
                    </p>
                </Card>

                {/* Your Rights and Choices */}
                <Card className="bg-white p-6 mb-6 shadow-lg hover:shadow-xl transition-shadow">
                    <h2 className="font-quicksand font-bold text-2xl text-pinky-dark mb-4">7. Your Rights and Choices</h2>

                    <div className="bg-pink-50 p-4 rounded-lg mb-4">
                        <h3 className="font-quicksand font-semibold text-xl text-primary mb-3">Your Rights</h3>
                        <p className="text-gray-700 mb-4">Depending on your location, you may have the following rights regarding your personal information:</p>
                        <ul className="list-disc pl-6 text-gray-700 space-y-2">
                            <li><strong className="text-pinky-dark">Access:</strong> Request access to your personal information</li>
                            <li><strong className="text-pinky-dark">Correction:</strong> Request correction of inaccurate personal information</li>
                            <li><strong className="text-pinky-dark">Deletion:</strong> Request deletion of your personal information</li>
                            <li><strong className="text-pinky-dark">Data Portability:</strong> Request a copy of your personal information in a structured, commonly used format</li>
                            <li><strong className="text-pinky-dark">Opt-Out:</strong> Opt-out of certain uses of your personal information</li>
                            <li><strong className="text-pinky-dark">Withdraw Consent:</strong> Withdraw your consent where we rely on consent to process your information</li>
                        </ul>
                    </div>

                    <div className="bg-pink-50 p-4 rounded-lg mb-4">
                        <h3 className="font-quicksand font-semibold text-xl text-primary mb-3">Cookie Choices</h3>
                        <p className="text-gray-700">
                            Most web browsers are set to accept cookies by default. You can usually choose to set your browser to remove or reject browser cookies. Please note that if you choose to remove or reject cookies, this could affect the availability and functionality of our Website.
                        </p>
                    </div>

                    <div className="bg-pink-50 p-4 rounded-lg">
                        <h3 className="font-quicksand font-semibold text-xl text-primary mb-3">Do Not Track</h3>
                        <p className="text-gray-700">
                            Some browsers include a "Do Not Track" (DNT) feature that signals to websites that you do not want to be tracked. Because there is not yet a common understanding of how to interpret DNT signals, our Website does not currently respond to browser DNT signals.
                        </p>
                    </div>
                </Card>

                {/* Third-Party Links */}
                <Card className="bg-white p-6 mb-6 shadow-lg hover:shadow-xl transition-shadow">
                    <h2 className="font-quicksand font-bold text-2xl text-pinky-dark mb-4">8. Third-Party Links</h2>
                    <p className="text-gray-700">
                        Our Website may contain links to third-party websites, including our Instagram page (@pinkytoepaper). We are not responsible for the privacy practices or content of these third-party sites. We encourage you to read the privacy policies of any third-party sites you visit.
                    </p>
                </Card>

                {/* Children's Privacy */}
                <Card className="bg-white p-6 mb-6 shadow-lg hover:shadow-xl transition-shadow">
                    <h2 className="font-quicksand font-bold text-2xl text-pinky-dark mb-4">9. Children's Privacy</h2>
                    <p className="text-gray-700">
                        Our Website is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
                    </p>
                </Card>

                {/* International Data Transfers */}
                <Card className="bg-white p-6 mb-6 shadow-lg hover:shadow-xl transition-shadow">
                    <h2 className="font-quicksand font-bold text-2xl text-pinky-dark mb-4">10. International Data Transfers</h2>
                    <p className="text-gray-700">
                        Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that are different from the laws of your country. By using our Website, you consent to the transfer of information to countries outside of your country of residence.
                    </p>
                </Card>

                {/* California Privacy Rights */}
                <Card className="bg-white p-6 mb-6 shadow-lg hover:shadow-xl transition-shadow">
                    <h2 className="font-quicksand font-bold text-2xl text-pinky-dark mb-4">11. California Privacy Rights</h2>
                    <p className="text-gray-700 mb-4">
                        If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA), including:
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-2">
                        <li>The right to know what personal information we collect, use, disclose, and sell</li>
                        <li>The right to request deletion of your personal information</li>
                        <li>The right to opt-out of the sale of your personal information (we do not sell personal information)</li>
                        <li>The right not to be discriminated against for exercising your privacy rights</li>
                    </ul>
                </Card>

                {/* Changes to This Privacy Policy */}
                <Card className="bg-white p-6 mb-6 shadow-lg hover:shadow-xl transition-shadow">
                    <h2 className="font-quicksand font-bold text-2xl text-pinky-dark mb-4">12. Changes to This Privacy Policy</h2>
                    <p className="text-gray-700">
                        We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this policy. You are advised to review this Privacy Policy periodically for any changes.
                    </p>
                </Card>

                {/* Contact Information */}
                <Card className="bg-white p-6 mb-6 shadow-lg hover:shadow-xl transition-shadow">
                    <h2 className="font-quicksand font-bold text-2xl text-pinky-dark mb-4">13. Contact Information</h2>
                    <p className="text-gray-700 mb-4">
                        If you have any questions about this Privacy Policy, your rights, or our data practices, please contact us at:
                    </p>
                    <Card className="bg-pink-50 p-4">
                        <p className="text-gray-700 mb-2"><strong className="text-pinky-dark">The Pinky Toe</strong></p>
                        <p className="text-gray-700 mb-2">
                            Email: <a href="mailto:hello@pinkytoe.com" className="text-primary hover:text-pinky-dark transition-colors">hello@pinkytoe.com</a>
                        </p>
                        <p className="text-gray-700 mb-2">
                            Instagram: <a href="https://instagram.com/pinkytoepaper" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-pinky-dark transition-colors">@pinkytoepaper</a>
                        </p>
                        <p className="text-gray-700">
                            Website: <a href="https://www.pinkytoe.com" className="text-primary hover:text-pinky-dark transition-colors">www.pinkytoe.com</a>
                        </p>
                    </Card>
                </Card>

                {/* Meta Compliance Notice */}
                <Card className="bg-pink-100 p-6 mb-8 shadow-lg border-2 border-pink-200">
                    <p className="text-sm text-gray-600 italic">
                        This Privacy Policy is provided for informational purposes and compliance with applicable privacy laws. For Meta Platform integration and app development purposes, this policy demonstrates our commitment to user privacy and data protection standards.
                    </p>
                </Card>
            </div>
        </Layout>
    );
}