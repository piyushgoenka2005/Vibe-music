const WEB3FORMS_SUBMIT_URL = "https://api.web3forms.com/submit";

export interface NewsletterFormData {
  firstName: string;
  lastName: string;
  email: string;
  marketingConsent: boolean;
}

interface Web3FormsResponse {
  success: boolean;
  message?: string;
}

function getWeb3FormsAccessKey(): string | undefined {
  return process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY?.trim();
}

export function isWeb3FormsConfigured(): boolean {
  return Boolean(getWeb3FormsAccessKey());
}

function buildFormData(data: NewsletterFormData, accessKey: string): FormData {
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();
  const formData = new FormData();

  formData.append("access_key", accessKey);
  formData.append("subject", "New Vibe Music Newsletter Signup");
  formData.append("from_name", "Vibe Music Website");
  formData.append("name", fullName || data.email);
  formData.append("email", data.email);
  formData.append("first_name", data.firstName || "—");
  formData.append("last_name", data.lastName || "—");
  formData.append("marketing_consent", data.marketingConsent ? "Yes" : "No");
  formData.append("botcheck", "");

  return formData;
}

/** Web3Forms must be called from the browser — server-side requests return 403. */
export async function submitNewsletterToWeb3Forms(
  data: NewsletterFormData
): Promise<{ success: boolean; message: string }> {
  const accessKey = getWeb3FormsAccessKey();
  if (!accessKey) {
    throw new Error(
      "Newsletter signup is not configured. Restart the dev server after adding NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY."
    );
  }

  const response = await fetch(WEB3FORMS_SUBMIT_URL, {
    method: "POST",
    body: buildFormData(data, accessKey),
  });

  const result = (await response.json().catch(() => null)) as Web3FormsResponse | null;

  if (!response.ok || !result?.success) {
    if (process.env.NODE_ENV === "development") {
      console.error("[newsletter] Web3Forms response:", {
        status: response.status,
        result,
      });
    }

    throw new Error(
      result?.message ??
        (response.status === 403
          ? "Newsletter signup was blocked by Web3Forms."
          : "Could not sign you up. Please try again.")
    );
  }

  return {
    success: true,
    message: result.message ?? "Thanks for joining the Vibe Music list!",
  };
}
