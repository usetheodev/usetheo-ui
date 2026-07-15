import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "../../../test/a11y.js";
import { IOCards } from "./index.js";

const CHAT = JSON.stringify([
  { role: "system", content: "You are a travel agent." },
  { role: "user", content: "Find flights POA→GRU" },
  {
    role: "assistant",
    content: "Let me search.",
    tool_calls: [
      { id: "call_1", function: { name: "search_flights", arguments: '{"from":"POA"}' } },
    ],
  },
  { role: "tool", content: '{"flights":[]}', tool_call_id: "call_1" },
]);

const longHistory = JSON.stringify(
  Array.from({ length: 10 }, (_, i) => ({
    role: i % 2 ? "assistant" : "user",
    content: `msg ${i}`,
  })),
);

describe("IOCards", () => {
  it("test_renderiza_card_por_mensagem_com_badge_de_role", () => {
    render(<IOCards value={CHAT} />);
    const cards = screen.getAllByTestId("io-card");
    // system + user + assistant(tool_call has no body → no MessageCard) = system + user
    expect(cards.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("user")).toBeInTheDocument();
    expect(screen.getByText("assistant")).toBeInTheDocument();
  });

  it("test_tool_call_e_result_pareiam_por_id", () => {
    const { container } = render(<IOCards value={CHAT} />);
    expect(container.querySelector('[data-slot="io-tool-call"]')).toBeInTheDocument();
    const result = container.querySelector('[data-slot="io-tool-result"]') as HTMLElement;
    expect(within(result).getByText(/call_1/)).toBeInTheDocument();
  });

  it("test_nao_chat_cai_no_json_viewer", () => {
    const { container } = render(<IOCards value='{"a":1,"b":2}' />);
    expect(container.querySelector('[data-slot="json-viewer"]')).toBeInTheDocument();
  });

  it("test_valor_vazio_mostra_travessao", () => {
    render(<IOCards value="" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("test_historico_longo_colapsa_com_show_more", () => {
    render(<IOCards value={longHistory} />);
    expect(screen.getByRole("button", { name: /show 4 more/i })).toBeInTheDocument();
  });

  it("test_default_render_nao_interpreta_html", () => {
    const evil = JSON.stringify([{ role: "user", content: "<img src=x onerror=alert(1)>" }]);
    const { container } = render(<IOCards value={evil} />);
    expect(container.querySelector("img")).toBeNull();
    // the literal text is shown escaped
    expect(screen.getByText(/<img src=x/)).toBeInTheDocument();
  });

  it("test_render_markdown_slot_e_usado_quando_fornecido", () => {
    const single = JSON.stringify([{ role: "user", content: "hello" }]);
    render(
      <IOCards value={single} renderMarkdown={(t) => <strong data-testid="md">{t}</strong>} />,
    );
    expect(screen.getByTestId("md")).toHaveTextContent("hello");
  });

  it("test_redacted_thinking_mostra_placeholder", () => {
    const redacted = JSON.stringify([{ role: "assistant", content: "<REDACTED>" }]);
    render(<IOCards value={redacted} />);
    expect(screen.getByText(/redacted thinking/i)).toBeInTheDocument();
  });

  it("test_raw_json_toggle_por_mensagem", async () => {
    const user = userEvent.setup();
    const single = JSON.stringify([{ role: "user", content: "hi" }]);
    const { container } = render(<IOCards value={single} />);
    await user.click(screen.getByRole("button", { name: /show raw json/i }));
    expect(container.querySelector('[data-slot="json-viewer"]')).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<IOCards value={CHAT} />);
  });
});
