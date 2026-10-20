import {
  FieldControl,
  FieldDescription,
  FieldError,
  type FieldErrors,
  FieldLabel,
  FieldRoot,
  FieldValidity,
  Form,
  type FormActions,
  Input,
} from "@xoroh/axis";
import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "../theme";
import type { Demo } from "./registry";

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Sign-up form demo: required fields, pattern validation, a custom
 * username check, and server errors mapped onto fields — all
 * unstyled Axis behavior with demo-owned caller styles.
 */
export const FormsDemo: Demo = {
  slug: "forms",
  title: "Forms",
  components: [
    "Form",
    "FieldRoot",
    "FieldLabel",
    "FieldControl",
    "FieldDescription",
    "FieldError",
    "FieldValidity",
  ],
  render: function FormsScreen() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [serverErrors, setServerErrors] = useState<FieldErrors>({});
    const [submitted, setSubmitted] = useState<string | null>(null);
    const formActions = useRef<FormActions>(null);
    const { theme } = useTheme();

    const inputStyle = {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      color: theme.text,
      fontSize: 14,
    };
    const labelStyle = {
      fontSize: 13,
      fontWeight: "600" as const,
      color: theme.text,
    };

    const submit = () => {
      // Fake server round-trip: "taken" is already registered.
      const server: FieldErrors = {};
      if (username === "taken") {
        server.username = "That username is taken";
      }
      setServerErrors(server);
      if (Object.keys(server).length === 0) {
        setSubmitted(`${username} <${email}>`);
      } else {
        setSubmitted(null);
      }
    };

    return (
      <View style={{ gap: 20 }}>
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 16,
          }}
        >
          <Form
            errors={serverErrors}
            onClearErrors={() => setServerErrors({})}
            onFormSubmit={submit}
            actionsRef={formActions}
          >
            <FieldRoot
              style={{ gap: 8 }}
              name="username"
              validate={(v) => {
                if (typeof v !== "string" || v === "") return "Required";
                if (v.length < 3) return "At least 3 characters";
                return null;
              }}
            >
              <FieldLabel style={labelStyle}>Username</FieldLabel>
              <FieldControl>
                <Input
                  testID="signup-username"
                  value={username}
                  onValueChange={setUsername}
                  placeholder="e.g. ada"
                  style={inputStyle}
                />
              </FieldControl>
              <FieldDescription>
                Required, at least 3 characters.
              </FieldDescription>
              <FieldError>
                <Text>Invalid username</Text>
              </FieldError>
            </FieldRoot>

            <FieldRoot
              style={{ gap: 8 }}
              name="email"
              validationMode="onBlur"
              validate={(v) => {
                if (typeof v !== "string" || v === "") return "Required";
                if (!EMAIL_PATTERN.test(v)) return "Bad email";
                return null;
              }}
            >
              <FieldLabel style={labelStyle}>Email</FieldLabel>
              <FieldControl>
                <Input
                  testID="signup-email"
                  value={email}
                  onValueChange={setEmail}
                  placeholder="e.g. ada@example.com"
                  style={inputStyle}
                />
              </FieldControl>
              <FieldDescription>
                Validated when you leave the field.
              </FieldDescription>
              <FieldError>
                <Text>Enter a valid email</Text>
              </FieldError>
            </FieldRoot>

            <FieldRoot
              style={{ gap: 8 }}
              name="password"
              validate={(v) => {
                if (typeof v !== "string" || v === "") return "Required";
                if (v.length < 8) return "At least 8 characters";
                return null;
              }}
            >
              <FieldLabel style={labelStyle}>Password</FieldLabel>
              <FieldControl>
                <Input
                  testID="signup-password"
                  value={password}
                  onValueChange={setPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </FieldControl>
              <FieldDescription>
                Custom check: at least 8 characters.
              </FieldDescription>
              <FieldError>
                <Text>Password too short</Text>
              </FieldError>
              <FieldValidity>
                {(s) => {
                  if (typeof s.value !== "string" || s.value === "") {
                    return null;
                  }
                  const left = 8 - s.value.length;
                  return (
                    <Text style={{ fontSize: 12, color: theme.textSubtle }}>
                      {left <= 0
                        ? "Looks good."
                        : `${left} more character${left === 1 ? "" : "s"} needed.`}
                    </Text>
                  );
                }}
              </FieldValidity>
            </FieldRoot>

            <Pressable
              accessibilityRole="button"
              aria-label="Create account"
              onPress={() => formActions.current?.submit()}
              style={{
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: theme.primary,
                alignItems: "center",
              }}
            >
              <Text style={{ color: theme.primaryFg, fontWeight: "700" }}>
                Create account
              </Text>
            </Pressable>
          </Form>
        </View>

        {submitted !== null ? (
          <View
            style={{
              backgroundColor: theme.surface,
              padding: 18,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.borderSubtle,
            }}
          >
            <Text style={{ color: theme.text }}>Submitted as {submitted}</Text>
          </View>
        ) : null}
      </View>
    );
  },
};
