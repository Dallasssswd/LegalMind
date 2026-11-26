"""LegalMind: retro legal scenario game (desktop prototype)."""
import customtkinter as ctk
from database import Database

BG = "#080e09"
PANEL = "#101b12"
GREEN = "#39ff78"
DIM = "#83b68d"
FONT = "Consolas"

ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("green")

class LegalMind(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("LegalMind | Legal Simulation System")
        self.geometry("1050x720")
        self.minsize(830, 600)
        self.configure(fg_color=BG)
        self.db = Database()
        self.current_case = None
        self.render_menu()

    def clear(self):
        for widget in self.winfo_children():
            widget.destroy()

    def heading(self, title, subtitle=""):
        ctk.CTkLabel(self, text=title, font=(FONT, 38, "bold"),
                     text_color=GREEN).pack(pady=(30, 5))
        if subtitle:
            ctk.CTkLabel(self, text=subtitle, font=(FONT, 13),
                         text_color=DIM).pack(pady=(0, 22))

    def button(self, label, command):
        return ctk.CTkButton(
            self, text=label, command=command, width=520, height=47,
            font=(FONT, 17), fg_color=PANEL, hover_color="#173e21",
            text_color=GREEN, border_width=1, border_color="#246a38",
            corner_radius=3
        )

    def render_menu(self):
        self.clear()
        self.heading("LEGALMIND", "LEGAL SIMULATION SYSTEM // v0.2.0")
        stats = self.db.get_stats()
        ctk.CTkLabel(self, text="[ OK ] SYSTEM INITIALIZED",
                     font=(FONT, 15), text_color=GREEN).pack(pady=9)
        ctk.CTkLabel(self, text=f"RANK: {stats['rank']}   |   XP: {stats['xp']}   |   CASES SOLVED: {stats['cases']}",
                     font=(FONT, 14), text_color=DIM).pack(pady=(0, 24))
        for label, cmd in [
            ("01  >  SCENARIO CHALLENGES", self.scenario),
            ("02  >  COURTROOM SIMULATOR", self.courtroom),
            ("03  >  CAREER MODE", self.career),
            ("04  >  CASE ARCHIVES", self.archives),
            ("05  >  SETTINGS / API STATUS", self.settings),
            ("06  >  EXIT SYSTEM", self.destroy),
        ]:
            self.button(label, cmd).pack(pady=5)
        ctk.CTkLabel(self, text="root@legalmind:~$ _",
                     font=(FONT, 13), text_color=GREEN).pack(pady=22)

    def page(self, title, description):
        self.clear()
        self.heading(title, description)
        self.button("< RETURN TO MAIN MENU", self.render_menu).pack(side="bottom", pady=22)

    def scenario(self):
        self.page("SCENARIO CHALLENGE", "CASE 001 // NORTH CAROLINA // FOURTH AMENDMENT")
        self.current_case = {
            "title": "The Vehicle Search",
            "details": (
                "An officer stops a driver for an expired registration. "
                "Without asking for consent, the officer searches the vehicle "
                "and finds stolen property. No other facts are provided.\n\n"
                "Discuss which additional facts matter, possible legal grounds "
                "for a search, and whether suppression of the evidence is appropriate."
            )
        }
        ctk.CTkLabel(self, text=self.current_case["title"], font=(FONT, 22, "bold"),
                     text_color=GREEN).pack(pady=10)
        ctk.CTkLabel(self, text=self.current_case["details"], wraplength=710,
                     justify="left", font=(FONT, 15), text_color=DIM).pack(pady=12)
        self.answer = ctk.CTkTextbox(self, width=720, height=160,
                                      font=(FONT, 15), fg_color=PANEL, text_color=GREEN)
        self.answer.pack(pady=12)
        self.feedback = ctk.CTkLabel(self, text="", wraplength=700,
                                      font=(FONT, 14), text_color=GREEN)
        self.feedback.pack(pady=8)
        self.button("SUBMIT LEGAL ARGUMENT", self.submit_answer).pack(pady=9)

    def submit_answer(self):
        response = self.answer.get("1.0", "end").strip()
        if len(response) < 25:
            self.feedback.configure(text="[ ERROR ] Expand your legal reasoning before submitting.")
            return
        # Offline scoring is deliberately about effort; it is not a legal accuracy grade.
        self.db.save_case(self.current_case["title"], response, xp=10)
        self.feedback.configure(text="[ SAVED ] +10 XP for completing the argument. "
                               "AI legal evaluation will arrive in the next development phase.")
        self.answer.configure(state="disabled")

    def courtroom(self):
        self.page("COURTROOM SIMULATOR", "[ UNDER CONSTRUCTION ]")
        ctk.CTkLabel(self, text="Coming next: interactive testimony, objections, "
                     "and an AI judge.", wraplength=700, font=(FONT, 17),
                     text_color=GREEN).pack(pady=35)

    def career(self):
        self.page("CAREER MODE", "PLAYER DOSSIER")
        stats = self.db.get_stats()
        ctk.CTkLabel(self, text=f"CURRENT RANK: {stats['rank']}\n"
                     f"TOTAL EXPERIENCE: {stats['xp']} XP\n"
                     f"COMPLETED CASES: {stats['cases']}",
                     font=(FONT, 18), text_color=GREEN, justify="left").pack(pady=36)

    def archives(self):
        self.page("CASE ARCHIVES", "RECENT CASE HISTORY")
        entries = self.db.get_cases()
        if not entries:
            ctk.CTkLabel(self, text="[ EMPTY ] No submitted cases yet.",
                         font=(FONT, 16), text_color=DIM).pack(pady=25)
        else:
            viewer = ctk.CTkTextbox(self, width=750, height=340,
                                    font=(FONT, 14), fg_color=PANEL, text_color=GREEN)
            viewer.pack(pady=10)
            for case in entries:
                viewer.insert("end", f"[{case['created_at']}] {case['title']} (+{case['xp']} XP)\n"
                              f"{case['argument']}\n\n{'-' * 65}\n\n")
            viewer.configure(state="disabled")

    def settings(self):
        self.page("SYSTEM SETTINGS", "OPENAI CONNECTION STATUS")
        import os
        from dotenv import load_dotenv
        load_dotenv()
        configured = bool(os.getenv("OPENAI_API_KEY"))
        message = "[ CONFIGURED ] API key found in local environment." if configured else (
            "[ OFFLINE ] No API key configured. Add OPENAI_API_KEY to your local .env file. "
            "Never commit this file to GitHub."
        )
        ctk.CTkLabel(self, text=message, wraplength=700,
                     font=(FONT, 15), text_color=GREEN).pack(pady=35)

if __name__ == "__main__":
    app = LegalMind()
    app.mainloop()
