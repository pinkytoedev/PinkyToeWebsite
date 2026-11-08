import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GamesEditor from "@/pages/games-editor";
import { API_ROUTES } from "@/lib/constants";
import { todayKey } from "@/lib/games";

vi.mock("@/components/layout/layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("games editor publishing", () => {
  it("shows validation and publish confirmation next to the button and invalidates the daily game", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        published: { publishedAt: "2026-11-07T12:00:00.000Z" },
      }), { status: 200 }));

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const key = [API_ROUTES.GAMES_DAILY(todayKey())];
    client.setQueryData(key, { content: null });
    render(
      <QueryClientProvider client={client}>
        <GamesEditor />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "editor" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    const publish = await screen.findByRole("button", { name: "Publish official games" });
    fireEvent.click(publish);
    expect(screen.getByRole("alert")).toHaveTextContent("Toedle answer must be exactly five letters");
    expect(publish.closest(".sticky")).toContainElement(screen.getByRole("alert"));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText("Official five-letter answer"), { target: { value: "heels" } });
    const subjects = screen.getByLabelText("Who");
    fireEvent.change(subjects, { target: { value: "Local \nArea Husband\n" } });
    expect(subjects).toHaveValue("Local \nArea Husband\n");
    fireEvent.click(publish);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const toolbar = publish.closest(".sticky");
    expect(toolbar).not.toBeNull();
    expect(await within(toolbar as HTMLElement).findByRole("status")).toHaveTextContent(
      `Published the official games for ${todayKey()}.`,
    );
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body)).content.toedle.answer).toBe("HEELS");
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body)).content.headlineRoulette.subjects).toEqual(["Local", "Area Husband"]);
    fireEvent.change(screen.getByLabelText("Puzzle date"), { target: { value: "2027-01-01" } });
    expect(publish).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();
    expect(screen.getByText("Load saved content for the selected date before saving or publishing.")).toBeInTheDocument();
  });
});
