import HtmlSection from "@/components/sweetwater/HtmlSection";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <>
      <HtmlSection file="header" />
      <main className="homepage-wrapper" id="main-content">
        <section
          className="personalization-widgets"
          style={{ maxWidth: 480, margin: "0 auto", padding: "32px 16px" }}
        >
          <h2 className="personalization-widgets__greeting">Log In</h2>
          <LoginForm />
        </section>
      </main>
      <HtmlSection file="footer" />
    </>
  );
}
