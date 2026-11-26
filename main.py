"""LegalMind v0.3: AI-powered scenarios and courtroom simulator."""
import threading
import customtkinter as ctk
from ai_engine import AIError, ready, case, grade, witness_reply, set_api_key, clear_api_key
from database import Database
from speech import WindowsSpeech

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
        self.title("LegalMind | v0.4.0")
        self.geometry("1050x760")
        self.minsize(820, 620)
        self.configure(fg_color=BG)
        self.db = Database()
        self.speech = WindowsSpeech()
        self.protocol('WM_DELETE_WINDOW', self.close_app)
        self.case_data = None
        self.transcript = []
        self.view_id = 0
        self.busy = False
        self.render_menu()

    def close_app(self):
        self.speech.stop()
        self.destroy()

    def toggle_voice(self):
        self.speech.enabled = not self.speech.enabled
        if not self.speech.enabled:
            self.speech.stop()

    def clear(self):
        self.speech.stop()
        self.view_id += 1
        for widget in self.winfo_children():
            widget.destroy()
        self.busy = False

    def label(self, parent, text, size=15, color=GREEN, **kwargs):
        return ctk.CTkLabel(parent, text=text, text_color=color,
                            font=(FONT, size), **kwargs)

    def button(self, parent, text, action, width=390):
        return ctk.CTkButton(parent, text=text, command=action, width=width,
                             height=43, fg_color=PANEL, hover_color="#173e21",
                             text_color=GREEN, border_width=1,
                             border_color="#246a38", corner_radius=3,
                             font=(FONT, 15))

    def screen(self, name, subtitle):
        self.clear()
        self.label(self, name, 35, GREEN).pack(pady=(18, 3))
        self.label(self, subtitle, 12, DIM).pack(pady=(0, 10))
        panel = ctk.CTkScrollableFrame(self, fg_color=BG)
        panel.pack(fill="both", expand=True, padx=30, pady=8)
        self.button(self, "< RETURN TO MAIN MENU", self.render_menu, 300).pack(pady=10)
        return panel

    def render_menu(self):
        p = self.screen("LEGALMIND", "LEGAL SIMULATION SYSTEM // v0.4.0")
        stats = self.db.get_stats()
        self.label(p, "[ OK ] SYSTEM INITIALIZED", 16).pack(pady=10)
        self.label(p, f"RANK: {stats['rank']} | XP: {stats['xp']} | COMPLETED: {stats['cases']}",
                   14, DIM).pack(pady=12)
        for name, action in (
            ("01 > SCENARIO CHALLENGES", lambda: self.play("scenario")),
            ("02 > COURTROOM SIMULATOR", lambda: self.play("courtroom")),
            ("03 > CAREER MODE", self.career),
            ("04 > CASE ARCHIVES", self.archives),
            ("05 > SETTINGS / API STATUS", self.settings),
            ("06 > EXIT SYSTEM", self.close_app),
        ):
            self.button(p, name, action, 520).pack(pady=7)
        self.label(p, "root@legalmind:~$ _", 13).pack(pady=15)

    def run_ai(self, operation, on_success):
        """Run network work off the GUI thread, and update widgets only on GUI thread."""
        if self.busy:
            return
        self.busy = True
        token = self.view_id
        self.status.configure(text="[ WORKING ] Contacting AI; please wait...")
        def worker():
            try:
                result, error = operation(), None
            except AIError as exc:
                result, error = None, str(exc)
            except Exception:
                result, error = None, "Unexpected error. Check settings and retry."
            def deliver():
                if token != self.view_id:
                    return
                self.busy = False
                if error:
                    self.status.configure(text="[ ERROR ] " + error)
                else:
                    on_success(result)
            self.after(0, deliver)
        threading.Thread(target=worker, daemon=True).start()

    def play(self, mode):
        self.mode = mode
        self.case_data = None
        self.transcript = []
        p = self.screen("COURTROOM SIMULATOR" if mode == "courtroom" else "SCENARIO CHALLENGE",
                        "FICTIONAL LEGAL EDUCATION // AI-GENERATED CONTENT")
        selector = ctk.CTkFrame(p, fg_color=PANEL)
        selector.pack(fill="x", padx=12, pady=8)
        self.label(selector, "JURISDICTION", 12, DIM).pack(pady=(10, 2))
        self.jurisdiction = ctk.CTkOptionMenu(selector,
            values=["North Carolina", "Federal (U.S.)", "South Carolina",
                    "California", "New York"], width=275)
        self.jurisdiction.pack(pady=3)
        self.label(selector, "LEGAL CATEGORY", 12, DIM).pack(pady=(8, 2))
        self.category = ctk.CTkOptionMenu(selector,
            values=["Constitutional Law", "Criminal Law", "Cyber Law", "Civil Law",
                    "Business Law"], width=275)
        self.category.pack(pady=3)
        self.label(selector, "DIFFICULTY", 12, DIM).pack(pady=(8, 2))
        self.difficulty = ctk.CTkOptionMenu(selector,
            values=["Easy", "Medium", "Hard", "Expert"], width=275)
        self.difficulty.set("Medium")
        self.difficulty.pack(pady=(3, 12))
        self.button(p, "GENERATE NEW CASE", self.generate).pack(pady=9)
        self.status = self.label(p,
            "[ READY ] Generate a case to begin." if ready()
            else "[ OFFLINE ] Go to Settings and enter your API key for this session.", 13, DIM,
            wraplength=760)
        self.status.pack(pady=8)
        self.case_panel = ctk.CTkFrame(p, fg_color=BG)
        self.case_panel.pack(fill="x", padx=14, pady=6)

    def generate(self):
        if self.busy:
            return
        jurisdiction = self.jurisdiction.get()
        category = self.category.get()
        difficulty = self.difficulty.get()
        mode = self.mode
        self.run_ai(lambda: case(jurisdiction, category, difficulty, mode),
                    self.show_case)

    def show_case(self, data):
        self.case_data = data
        self.transcript = []
        for widget in self.case_panel.winfo_children():
            widget.destroy()
        self.status.configure(text="[ SUCCESS ] Case generated. Analyze the facts.")
        self.speech.speak("New case. " + data["title"] + ". " + data["facts"] + ". " + data["question"])
        self.label(self.case_panel, data["title"].upper(), 23, GREEN,
                   wraplength=760).pack(pady=(6, 10))
        self.label(self.case_panel, data["facts"], 15, DIM, wraplength=750,
                   justify="left").pack(pady=8)
        self.label(self.case_panel, "LEGAL QUESTION: " + data["question"], 15,
                   GREEN, wraplength=750, justify="left").pack(pady=8)
        self.button(self.case_panel, "REPLAY LAST AUDIO", self.speech.replay, 250).pack(pady=5)
        self.button(self.case_panel, "STOP AUDIO", self.speech.stop, 250).pack(pady=5)

        if self.mode == "courtroom":
            self.label(self.case_panel,
                "WITNESS: " + (data.get("witness_name") or "Fictional witness"),
                17).pack(pady=(14, 4))
            self.label(self.case_panel, data.get("witness_background", ""), 13,
                       DIM, wraplength=750).pack()
            self.log = ctk.CTkTextbox(self.case_panel, height=145, width=720,
                                      fg_color=PANEL, text_color=GREEN,
                                      font=(FONT, 13))
            self.log.pack(pady=8)
            self.log.insert("end", "[ COURTROOM ] You may question the witness.\n")
            self.log.configure(state="disabled")
            self.question_entry = ctk.CTkEntry(
                self.case_panel, width=690,
                placeholder_text="Type a question for the fictional witness...")
            self.question_entry.pack(pady=4)
            self.button(self.case_panel, "QUESTION WITNESS", self.question_witness).pack(pady=5)
        self.label(self.case_panel, "YOUR LEGAL ARGUMENT", 15).pack(pady=(15, 4))
        self.answer = ctk.CTkTextbox(self.case_panel, width=720, height=140,
                                      fg_color=PANEL, text_color=GREEN,
                                      font=(FONT, 14))
        self.answer.pack(pady=6)
        self.submit_button = self.button(
            self.case_panel, "PRESENT CLOSING ARGUMENT TO JUDGE" if self.mode == "courtroom"
            else "SUBMIT ARGUMENT FOR AI GRADING", self.submit_argument)
        self.submit_button.pack(pady=8)
        self.results = ctk.CTkTextbox(
            self.case_panel, width=720, height=160,
            fg_color=PANEL, text_color=GREEN, font=(FONT, 14))
        self.results.pack(pady=8)
        self.results.insert("end", "[ EVALUATION PENDING ]")
        self.results.configure(state="disabled")

    def question_witness(self):
        if self.busy or not self.case_data:
            return
        question = self.question_entry.get().strip()
        if len(question) < 5:
            self.status.configure(text="[ ERROR ] Ask a complete question.")
            return
        if len(self.transcript) >= 12:
            self.status.configure(text="[ LIMIT ] Six questions per courtroom session.")
            return
        data = self.case_data
        history = list(self.transcript)
        self.run_ai(lambda: witness_reply(data, history, question),
                    lambda reply: self.add_testimony(question, reply))

    def add_testimony(self, question, reply):
        self.transcript.extend([
            {"role": "player", "text": question},
            {"role": "witness", "text": reply}
        ])
        self.log.configure(state="normal")
        self.log.insert("end", "\nYOU: " + question + "\nWITNESS: " + reply + "\n")
        self.log.see("end")
        self.log.configure(state="disabled")
        self.question_entry.delete(0, "end")
        self.status.configure(text="[ READY ] Witness answered. Continue or submit.")
        self.speech.speak(reply)

    def submit_argument(self):
        if self.busy or not self.case_data or self.submit_button.cget("state") == "disabled":
            return
        argument = self.answer.get("1.0", "end").strip()
        if len(argument) < 25:
            self.status.configure(text="[ ERROR ] Please write at least 25 characters of reasoning.")
            return
        data, transcript = self.case_data, list(self.transcript)
        self.run_ai(lambda: grade(data, argument, transcript),
                    lambda evaluation: self.show_grade(argument, evaluation))

    def show_grade(self, argument, result):
        score = result["score"]
        xp = max(5, score // 5)
        feedback = (
            f"SCORE: {score}/100     XP EARNED: +{xp}\n\n"
            f"JUDGE'S FEEDBACK:\n{result['feedback']}\n\n"
            f"STRENGTH:\n{result['strength']}\n\n"
            f"TO IMPROVE:\n{result['improvement']}\n\n"
            "[ NOTE ] AI feedback is educational, not verified legal advice."
        )
        self.db.save_case(self.case_data["title"], argument, xp=xp,
                          mode=self.mode, score=score, feedback=feedback)
        self.results.configure(state="normal")
        self.results.delete("1.0", "end")
        self.results.insert("end", feedback)
        self.results.configure(state="disabled")
        self.submit_button.configure(state="disabled")
        self.answer.configure(state="disabled")
        self.status.configure(text="[ SAVED ] Results stored in your local case archive.")
        self.speech.speak("Judge evaluation. Your score is " + str(score) + " out of 100. " + result["feedback"] + " " + result["improvement"])

    def career(self):
        p = self.screen("CAREER MODE", "PLAYER DOSSIER")
        stats = self.db.get_stats()
        self.label(p,
            f"CURRENT RANK: {stats['rank']}\n"
            f"TOTAL EXPERIENCE: {stats['xp']} XP\n"
            f"COMPLETED CASES: {stats['cases']}", 19,
            GREEN, justify="left").pack(pady=35)

    def archives(self):
        p = self.screen("CASE ARCHIVES", "RECENT CASE HISTORY")
        cases = self.db.get_cases()
        if not cases:
            self.label(p, "[ EMPTY ] No submitted cases yet.").pack(pady=35)
            return
        viewer = ctk.CTkTextbox(p, width=740, height=450, fg_color=PANEL,
                                text_color=GREEN, font=(FONT, 14))
        viewer.pack(pady=12)
        for item in cases:
            viewer.insert("end",
                f"[{item['created_at']}] {item['title']}\n"
                f"MODE: {item['mode'] or 'scenario'}  SCORE: "
                f"{item['score'] if item['score'] is not None else 'n/a'}"
                f"  XP: +{item['xp']}\nARGUMENT: {item['argument']}\n"
                f"{item['feedback'] or ''}\n\n{'-' * 55}\n\n")
        viewer.configure(state="disabled")

    def settings(self):
        p = self.screen("SYSTEM SETTINGS", "OPENAI API // SESSION-ONLY ACCESS")
        self.label(
            p, "[ CONNECTED ] Key is available for this session." if ready()
            else "[ OFFLINE ] Enter an API key to enable AI gameplay.",
            16, GREEN, wraplength=740
        ).pack(pady=(22, 12))
        self.label(p, "OPENAI API KEY (HIDDEN)", 13, DIM).pack(pady=6)
        entry = ctk.CTkEntry(
            p, width=600, height=42, show="*",
            placeholder_text="Paste a newly created sk-... key here"
        )
        entry.pack(pady=8)
        status = self.label(p, "The key is not saved to any file or database.",
                            13, DIM, wraplength=740)
        status.pack(pady=8)

        def use_key():
            try:
                set_api_key(entry.get())
            except AIError as exc:
                status.configure(text="[ ERROR ] " + str(exc))
            else:
                # Remove the key from the input widget after storing it in session memory.
                entry.delete(0, "end")
                status.configure(text="[ READY ] API key loaded into temporary memory. "
                                      "It disappears when the app exits. "
                                      "Generate a case to test the connection.")

        def forget_key():
            clear_api_key()
            entry.delete(0, "end")
            status.configure(text="[ CLEARED ] Session key reference discarded.")

        self.button(p, "USE KEY FOR THIS SESSION", use_key).pack(pady=7)
        self.button(p, "FORGET SESSION KEY NOW", forget_key).pack(pady=7)
        self.label(p, "WINDOWS VOICE NARRATION // FREE", 15, GREEN).pack(pady=(28, 8))
        self.voice_status = self.label(
            p, "Voice: ON" if self.speech.enabled else "Voice: MUTED",
            14, DIM
        )
        self.voice_status.pack(pady=5)

        def change_voice():
            self.toggle_voice()
            self.voice_status.configure(
                text="Voice: ON" if self.speech.enabled else "Voice: MUTED"
            )

        self.button(p, "TOGGLE VOICE ON / OFF", change_voice).pack(pady=6)
        self.button(p, "TEST WINDOWS VOICE",
                    lambda: self.speech.speak("LegalMind voice narration is ready.")).pack(pady=6)
        self.button(p, "STOP SPEAKING", self.speech.stop).pack(pady=6)
        self.label(
            p, "Uses your Windows speech voices. No voice API key, internet connection, "
            "or additional voice service fees required. Audio is not saved.",
            13, DIM, wraplength=740
        ).pack(pady=8)
        self.label(
            p, "Your key is sent directly to OpenAI only when you use AI features.\n"
            "It is not written to .env, SQLite, or GitHub.\n"
            "Closing LegalMind ends the session; enter the key again next time.\n"
            "Avoid screen sharing or screenshots while entering a key.\n"
            "Python cannot guarantee secure erasure of copies from process memory.\n"
            "Revoke any earlier API key that was exposed. API requests may incur charges.",
            13, DIM, wraplength=740
        ).pack(pady=25)


if __name__ == "__main__":
    LegalMind().mainloop()
