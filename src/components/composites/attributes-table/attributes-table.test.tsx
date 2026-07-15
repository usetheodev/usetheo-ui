import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "../../../test/a11y.js";
import { AttributesTable } from "./index.js";

const ATTRS = {
  "gen_ai.request.model": "claude-fable-5",
  "gen_ai.usage.input_tokens": 900,
  "user.email": "secret@example.com",
  "http.status_code": 200,
  "payload.body": { nested: true, items: [1, 2, 3] },
};

const isEmail = (key: string) => key === "user.email";

describe("AttributesTable", () => {
  it("test_agrupa_por_namespace", () => {
    render(<AttributesTable attrs={ATTRS} />);
    // namespaces: gen_ai, user, http, payload
    expect(screen.getByText(/gen_ai \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/user \(1\)/)).toBeInTheDocument();
  });

  it("test_valor_mascarado_ausente_do_dom_pre_reveal", () => {
    const { container } = render(<AttributesTable attrs={ATTRS} maskedKeys={isEmail} canReveal />);
    expect(container.innerHTML).not.toContain("secret@example.com");
    expect(screen.getByLabelText("Masked value")).toBeInTheDocument();
  });

  it("test_can_reveal_false_esconde_o_controle_de_reveal", () => {
    render(<AttributesTable attrs={ATTRS} maskedKeys={isEmail} canReveal={false} />);
    expect(screen.queryByRole("button", { name: /reveal masked value/i })).toBeNull();
    expect(screen.getByText("masked")).toBeInTheDocument();
  });

  it("test_reveal_exibe_valor_e_copy", async () => {
    const user = userEvent.setup();
    render(<AttributesTable attrs={ATTRS} maskedKeys={isEmail} canReveal />);
    await user.click(screen.getByRole("button", { name: /reveal masked value/i }));
    expect(screen.getByText("secret@example.com")).toBeInTheDocument();
  });

  it("test_valor_objeto_renderiza_no_json_viewer", () => {
    const { container } = render(<AttributesTable attrs={ATTRS} />);
    expect(container.querySelector('[data-slot="json-viewer"]')).toBeInTheDocument();
  });

  it("test_promoted_keys_viram_badges", () => {
    render(<AttributesTable attrs={ATTRS} promoted={["gen_ai.request.model"]} />);
    const badges = screen.getByTestId("attributes-badges");
    expect(badges).toHaveTextContent("claude-fable-5");
  });

  it("test_attrs_vazio_mostra_empty_state", () => {
    render(<AttributesTable attrs={{}} />);
    expect(screen.getByText(/no attributes/i)).toBeInTheDocument();
  });

  it("test_namespace_colapsa_e_expande", async () => {
    const user = userEvent.setup();
    render(<AttributesTable attrs={ATTRS} />);
    expect(screen.getByText("http.status_code")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /collapse http/i }));
    expect(screen.queryByText("http.status_code")).toBeNull();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<AttributesTable attrs={ATTRS} maskedKeys={isEmail} />);
  });
});
