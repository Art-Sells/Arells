"use client";

import React from 'react';
import Link from 'next/link';
import '../../app/css/privacy/privacy-policy.css';

const PrivacyPolicy: React.FC = () => {
  return (
    <div id="privacy-policy-wrapper">
      <h1 id="privacy-policy-title">Privacy Policy</h1>
      <p className="privacy-policy-text">
        Welcome to Arells. We value your privacy and are committed to protecting your personal information. This Privacy Policy outlines how we collect, use, and safeguard your data when you use our services. By being an Arells user, you agree to the following terms and conditions.
      </p>
      
      <h2 className="privacy-policy-subtitle">Compliance with Laws and Regulations</h2>
      <p className="privacy-policy-text">
         <strong>Jurisdictional Compliance</strong>: As an Arells user, you agree to follow the laws, rules, and regulations of your local and national jurisdictions. You acknowledge that it is your responsibility to ensure compliance with any relevant legal requirements in your area.
      </p>
      <p className="privacy-policy-text">
         <strong>Financial Compliance</strong>: You understand that cryptocurrency marketplaces, as new financial innovative ecosystems, remain broadly unregulated in the United States and global jurisdictions. To maintain financial compliance with current global laws, Arells reserves the right to pause, deny, or remove any user or transaction flagged as "non-compliant" or a "legal risk" by global regulators.
      </p>
      
      <h2 className="privacy-policy-subtitle">Data Collection and Use</h2>
      <p className="privacy-policy-text">
         <strong>Personal Information</strong>: We may collect personal information such as your name, email address, and financial details to provide you with our services. This information is used to verify your identity, process transactions, and improve our services.
      </p>
      <p className="privacy-policy-text">
         <strong>Transaction Data</strong>: We collect information related to your cryptocurrency transactions, including transaction history and details. This data is essential for maintaining accurate records and ensuring compliance with legal requirements.
      </p>
      <p className="privacy-policy-text">
         <strong>Usage Data</strong>: Arells collects data on how you use our platform, including your interactions with our services, IP address, and device information. This helps us improve our platform, enhance user experience, and detect potential security issues.
      </p>
      
      <h2 className="privacy-policy-subtitle">Data Security</h2>
      <p className="privacy-policy-text">
         <strong>Security Measures</strong>: We implement industry-standard security measures to protect your personal information and transaction data. This includes encryption, secure servers, and regular security audits.
      </p>
      <p className="privacy-policy-text">
         <strong>Access Control</strong>: Access to your personal information is restricted to authorized personnel only. We ensure that our staff is trained on data protection principles and practices.
      </p>
      <p className="privacy-policy-text">
         <strong>Third-Party Services</strong>: Arells may use third-party services for certain functions, such as payment processing and data storage. These third parties are required to adhere to our privacy standards and are prohibited from using your data for any other purposes.
      </p>
      
      <h2 className="privacy-policy-subtitle">User Rights</h2>
      <p className="privacy-policy-text">
         <strong>Data Access and Correction</strong>: You have the right to access and correct your personal information held by Arells. You can update your information through your account settings or by contacting our support team.
      </p>
      <p className="privacy-policy-text">
         <strong>Data Deletion</strong>: You may request the deletion of your personal information at any time. Please note that certain data may be retained to comply with legal obligations or for legitimate business purposes.
      </p>
      <p className="privacy-policy-text">
         <strong>Opt-Out</strong>: You have the right to opt-out of receiving promotional communications from Arells. You can unsubscribe from our marketing emails through the link provided in each email.
      </p>
      
      <h2 className="privacy-policy-subtitle">Regulatory Compliance</h2>
      <p className="privacy-policy-text">
         <strong>Legal Obligations</strong>: Arells complies with all applicable United States financial laws and regulations. We cooperate with law enforcement agencies and regulatory bodies as required by law.
      </p>
      <p className="privacy-policy-text">
         <strong>Non-Compliant Activities</strong>: Any activities deemed non-compliant with United States regulations or posing a legal risk may result in account suspension or termination. Arells reserves the right to take necessary actions to ensure compliance and mitigate risks.
      </p>
      
      <h2 className="privacy-policy-subtitle">Updates to Privacy Policy</h2>
      <p className="privacy-policy-text">
        Arells may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any significant updates through our platform or via email. Your continued use of our services constitutes acceptance of the updated policy.
      </p>
      
      <h2 className="privacy-policy-subtitle">Contact Us</h2>
      <p className="privacy-policy-text">
        If you have any questions or concerns about this Privacy Policy or your personal information, please contact us at:
      </p>
      <p className="privacy-policy-text">
        <strong>Arells Support Team</strong><br />
        <a href="mailto:support@arells.com">info@arells.com</a>
      </p>
    </div>
  );
};

export default PrivacyPolicy;
