import HtmlSection from "@/components/sweetwater/HtmlSection";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <>
      <HtmlSection file="header" />
      <main className="homepage-wrapper" id="main-content">
        <section
          className="personalization-widgets"
          style={{ maxWidth: 480, margin: "0 auto", padding: "32px 16px" }}
        >
          <h2 className="personalization-widgets__greeting">Create Account</h2>
          <RegisterForm />
        </section>
      </main>
      <HtmlSection file="footer" />
    </>
  );
}
