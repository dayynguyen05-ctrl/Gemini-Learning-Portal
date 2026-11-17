import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Lightbulb,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  UsersRound,
  Cpu,
  Wrench,
  Palette,
  BriefcaseBusiness,
  Check,
} from "lucide-react";
import "./career-guidance.css";

type ProfileId = "community" | "analysis" | "practical" | "creative" | "organization";

export interface CareerProfile {
  id: ProfileId;
  name: string;
  summary: string;
  strengths: string[];
  exampleRoles: string[];
  nextSteps: string[];
}

type Choice = {
  label: string;
  scores: Partial<Record<ProfileId, number>>;
};

type Question = {
  prompt: string;
  context: string;
  choices: Choice[];
};

const profiles: CareerProfile[] = [
  {
    id: "community",
    name: "Con người & cộng đồng",
    summary: "Bạn có thể thấy ý nghĩa trong việc lắng nghe, đồng hành và góp phần để mọi người cùng phát triển.",
    strengths: ["Biết lắng nghe", "Quan tâm đến cảm xúc và nhu cầu của người khác", "Hợp tác và kết nối"],
    exampleRoles: ["Giáo viên", "Chuyên viên tham vấn học đường", "Điều dưỡng", "Công tác xã hội"],
    nextSteps: ["Thử tham gia một hoạt động tình nguyện hoặc hỗ trợ bạn học.", "Ghi lại điều bạn thích khi làm việc cùng người khác.", "Trò chuyện với một người lớn đáng tin về các nghề chăm sóc, giáo dục."],
  },
  {
    id: "analysis",
    name: "Công nghệ & phân tích",
    summary: "Bạn có thể thích tìm quy luật, đặt câu hỏi và dùng thông tin hoặc công nghệ để giải quyết vấn đề.",
    strengths: ["Tò mò và thích tìm hiểu", "Suy nghĩ có hệ thống", "Kiên nhẫn với câu đố và dữ liệu"],
    exampleRoles: ["Lập trình viên", "Nhà phân tích dữ liệu", "Chuyên viên an ninh mạng", "Nhà nghiên cứu"],
    nextSteps: ["Thử một dự án lập trình hoặc câu lạc bộ khoa học phù hợp với lứa tuổi.", "Chọn một câu hỏi bạn tò mò và tìm hiểu từ vài nguồn đáng tin.", "Hỏi thầy cô về môn học hoặc hoạt động giúp rèn tư duy phân tích."],
  },
  {
    id: "practical",
    name: "Kỹ thuật & thực hành",
    summary: "Bạn có thể hứng thú với việc biến ý tưởng thành thứ hữu hình, thử nghiệm và tìm cách làm cho nó hoạt động tốt hơn.",
    strengths: ["Học tốt qua trải nghiệm", "Khéo léo và chú ý cách mọi thứ vận hành", "Thích sửa chữa, lắp ráp hoặc thử nghiệm"],
    exampleRoles: ["Kỹ sư cơ khí", "Kỹ thuật viên điện", "Chuyên viên thiết kế sản phẩm", "Kỹ thuật viên y tế"],
    nextSteps: ["Thử làm một mô hình nhỏ hoặc sửa một món đồ an toàn cùng người lớn.", "Tìm hiểu một câu lạc bộ STEM, thủ công hoặc thực hành tại trường.", "Quan sát một công việc thực tế và ghi lại những kỹ năng được sử dụng."],
  },
  {
    id: "creative",
    name: "Sáng tạo & truyền thông",
    summary: "Bạn có thể thích diễn đạt ý tưởng theo cách riêng và tạo ra nội dung khiến người khác chú ý hoặc hiểu hơn.",
    strengths: ["Tưởng tượng phong phú", "Nhạy với hình ảnh, câu chữ hoặc câu chuyện", "Biết truyền tải thông điệp"],
    exampleRoles: ["Nhà thiết kế đồ họa", "Biên tập viên", "Người làm nội dung", "Nhiếp ảnh gia"],
    nextSteps: ["Tạo một sản phẩm nhỏ: bài viết, áp phích, ảnh hoặc video ngắn.", "Xin góp ý từ người bạn tin tưởng rồi thử chỉnh sửa.", "Tìm hiểu cách một thông điệp tốt được kể qua nhiều hình thức."],
  },
  {
    id: "organization",
    name: "Kinh doanh & tổ chức",
    summary: "Bạn có thể thích sắp xếp nguồn lực, kết nối mọi người và biến một kế hoạch thành kết quả cụ thể.",
    strengths: ["Biết lên kế hoạch và theo dõi việc cần làm", "Chủ động phối hợp", "Quan tâm đến cách một ý tưởng tạo ra giá trị"],
    exampleRoles: ["Chuyên viên nhân sự", "Quản lý dự án", "Chuyên viên marketing", "Chủ cơ sở kinh doanh"],
    nextSteps: ["Thử lập kế hoạch cho một hoạt động lớp hoặc dự án nhóm nhỏ.", "Quan sát cách một cửa hàng, câu lạc bộ hay sự kiện được tổ chức.", "Tập chia một mục tiêu thành những bước nhỏ và cùng bạn thực hiện."],
  },
];

const questions: Question[] = [
  {
    prompt: "Trong một dự án nhóm ở trường, phần nào khiến bạn muốn bắt tay vào nhất?",
    context: "Không có lựa chọn đúng hay sai — hãy chọn điều nghe giống bạn nhất.",
    choices: [
      { label: "Giúp cả nhóm lắng nghe nhau và cùng tiến bộ", scores: { community: 2, organization: 1 } },
      { label: "Tìm thông tin, kiểm tra dữ kiện và giải câu hỏi khó", scores: { analysis: 2, practical: 1 } },
      { label: "Làm mô hình hoặc thử cách biến ý tưởng thành sản phẩm", scores: { practical: 2, analysis: 1 } },
      { label: "Nghĩ cách trình bày câu chuyện thật cuốn hút", scores: { creative: 2, community: 1 } },
      { label: "Chia việc, sắp xếp thời gian để nhóm đi đến đích", scores: { organization: 2, community: 1 } },
    ],
  },
  {
    prompt: "Bạn thường muốn làm gì khi gặp một vấn đề chưa có lời giải?",
    context: "Hãy nghĩ về cách bạn tự nhiên bắt đầu, không phải điều bạn nghĩ mình nên làm.",
    choices: [
      { label: "Hỏi xem những người liên quan đang cần gì", scores: { community: 2, organization: 1 } },
      { label: "Tách vấn đề thành các phần và tìm quy luật", scores: { analysis: 2, organization: 1 } },
      { label: "Thử vài cách thực tế để xem điều gì hiệu quả", scores: { practical: 2, analysis: 1 } },
      { label: "Nghĩ ra một góc nhìn mới hoặc cách giải thích khác", scores: { creative: 2, analysis: 1 } },
      { label: "Lập kế hoạch và rủ mọi người cùng thực hiện", scores: { organization: 2, practical: 1 } },
    ],
  },
  {
    prompt: "Bạn thấy điều gì khiến một ngày học tập có ý nghĩa?",
    context: "Chọn điều bạn thường thấy vui hoặc tự hào nhất.",
    choices: [
      { label: "Khi mình giúp ai đó cảm thấy được thấu hiểu", scores: { community: 2, creative: 1 } },
      { label: "Khi cuối cùng mình hiểu được một điều phức tạp", scores: { analysis: 2, practical: 1 } },
      { label: "Khi tự tay làm ra hoặc sửa được một thứ", scores: { practical: 2, creative: 1 } },
      { label: "Khi mình diễn đạt được điều muốn nói thật rõ", scores: { creative: 2, community: 1 } },
      { label: "Khi cả nhóm hoàn thành mục tiêu đã đề ra", scores: { organization: 2, community: 1 } },
    ],
  },
  {
    prompt: "Nếu được chọn một hoạt động ngoại khóa để thử, bạn nghiêng về điều nào?",
    context: "Bạn vẫn có thể khám phá những hoạt động khác sau này.",
    choices: [
      { label: "Một buổi hỗ trợ học tập hoặc hoạt động vì cộng đồng", scores: { community: 2, organization: 1 } },
      { label: "Câu lạc bộ khoa học, dữ liệu hoặc lập trình", scores: { analysis: 2, practical: 1 } },
      { label: "Lắp ráp, làm vườn, chế tạo hoặc thực hành STEM", scores: { practical: 2, analysis: 1 } },
      { label: "Viết, vẽ, làm phim hoặc sáng tạo nội dung", scores: { creative: 2, community: 1 } },
      { label: "Tổ chức sự kiện, gây quỹ hoặc điều phối câu lạc bộ", scores: { organization: 2, creative: 1 } },
    ],
  },
  {
    prompt: "Khi nghĩ về một nghề trong tương lai, điều gì quan trọng với bạn?",
    context: "Câu trả lời có thể thay đổi theo thời gian — cứ chọn điều hợp với bạn hôm nay.",
    choices: [
      { label: "Được làm việc trực tiếp với con người và tạo ích lợi", scores: { community: 2, organization: 1 } },
      { label: "Được tìm hiểu câu hỏi mới và giải quyết vấn đề", scores: { analysis: 2, creative: 1 } },
      { label: "Được tạo dựng, vận hành hoặc cải tiến những thứ hữu ích", scores: { practical: 2, analysis: 1 } },
      { label: "Được kể chuyện, thiết kế hoặc chia sẻ ý tưởng", scores: { creative: 2, organization: 1 } },
      { label: "Được kết nối nguồn lực để biến kế hoạch thành kết quả", scores: { organization: 2, community: 1 } },
    ],
  },
];

const profileIcons = {
  community: UsersRound,
  analysis: Cpu,
  practical: Wrench,
  creative: Palette,
  organization: BriefcaseBusiness,
};

const resultLabels = ["Gợi ý nổi bật", "Cũng đáng khám phá", "Một hướng khác"];

function rankProfiles(answers: number[]) {
  const scoreMap = new Map<ProfileId, number>(profiles.map((profile) => [profile.id, 0]));
  answers.forEach((answerIndex, questionIndex) => {
    const choice = questions[questionIndex]?.choices[answerIndex];
    if (!choice) return;
    Object.entries(choice.scores).forEach(([id, score]) => {
      scoreMap.set(id as ProfileId, (scoreMap.get(id as ProfileId) ?? 0) + (score ?? 0));
    });
  });

  return [...profiles]
    .sort((a, b) => (scoreMap.get(b.id)! - scoreMap.get(a.id)!) || profiles.findIndex((item) => item.id === a.id) - profiles.findIndex((item) => item.id === b.id))
    .slice(0, 3);
}

export default function CareerGuidance() {
  const [stage, setStage] = useState<"intro" | "questions" | "results">("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const ranked = useMemo(() => rankProfiles(answers), [answers]);
  const selectedAnswer = answers[currentQuestion];
  const question = questions[currentQuestion];

  function chooseAnswer(index: number) {
    setAnswers((previous) => {
      const next = [...previous];
      next[currentQuestion] = index;
      return next;
    });
  }

  function continueToNext() {
    if (selectedAnswer === undefined) return;
    if (currentQuestion === questions.length - 1) setStage("results");
    else setCurrentQuestion((index) => index + 1);
  }

  function retake() {
    setAnswers([]);
    setCurrentQuestion(0);
    setStage("questions");
  }

  return (
    <div className="career-page">
      <div className="career-shell">
        <header className="career-header">
          <div className="career-mark" aria-hidden="true"><Compass size={18} /></div>
          <span>GÓC KHÁM PHÁ BẢN THÂN</span>
          <span className="career-header-rule" />
          <span className="career-header-note">Một bước nhỏ, nhiều khả năng</span>
        </header>

        {stage === "intro" && (
          <main className="career-intro" data-testid="career-intro">
            <div className="career-intro-copy">
              <p className="career-eyebrow"><span /> KHÔNG CẦN BIẾT NGAY MÌNH SẼ LÀM GÌ</p>
              <h1>Thử lắng nghe<br /><em>điều khiến bạn tò mò.</em></h1>
              <p className="career-lede">
                Năm câu hỏi ngắn sẽ gợi mở vài hướng nghề nghiệp có thể hợp với điều bạn quan tâm. Không phải bài kiểm tra, cũng không phải quyết định cho tương lai.
              </p>
              <button className="career-primary-button" type="button" onClick={() => setStage("questions")} data-testid="button-start-exploration">
                Bắt đầu khám phá <ArrowRight size={18} aria-hidden="true" />
              </button>
              <div className="career-intro-meta">
                <span><span className="career-meta-dot" /> Khoảng 2 phút</span>
                <span><ShieldCheck size={15} /> Riêng tư ngay trên trình duyệt</span>
              </div>
            </div>
            <aside className="career-intro-aside" aria-label="Thông tin về hoạt động">
              <div className="career-aside-orbit"><div className="career-orbit-core"><Sparkles size={27} /></div></div>
              <p className="career-aside-label">MỘT ĐIỀU ĐÁNG NHỚ</p>
              <p className="career-aside-quote">“Bạn không cần chọn một con đường hôm nay. Chỉ cần bắt đầu nhận ra điều mình muốn tìm hiểu.”</p>
              <div className="career-aside-foot"><span /> ĐIỂM TỰA HỌC ĐƯỜNG</div>
            </aside>
          </main>
        )}

        {stage === "questions" && (
          <main className="career-quiz" data-testid="career-question-view">
            <div className="career-quiz-topline">
              <div>
                <p className="career-eyebrow"><span /> KHÁM PHÁ THEO CÁCH CỦA BẠN</p>
                <h1>Mỗi câu trả lời là<br className="career-mobile-break" /> một gợi mở.</h1>
              </div>
              <div className="career-progress-count" aria-live="polite" data-testid="text-question-progress">
                <strong>{String(currentQuestion + 1).padStart(2, "0")}</strong><span> / {String(questions.length).padStart(2, "0")}</span>
              </div>
            </div>
            <div className="career-progress-track" role="progressbar" aria-label="Tiến độ khám phá" aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={currentQuestion + 1}>
              <span style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
            </div>
            <section className="career-question-panel" aria-labelledby="career-question-title">
              <div className="career-question-index">CÂU HỎI {String(currentQuestion + 1).padStart(2, "0")}</div>
              <h2 id="career-question-title" data-testid="text-current-question">{question.prompt}</h2>
              <p className="career-question-context">{question.context}</p>
              <fieldset className="career-choice-list">
                <legend className="career-sr-only">{question.prompt}</legend>
                {question.choices.map((choice, index) => (
                  <label key={choice.label} className={`career-choice${selectedAnswer === index ? " is-selected" : ""}`} data-testid={`option-career-answer-${index + 1}`}>
                    <input
                      type="radio"
                      name={`career-question-${currentQuestion}`}
                      value={index}
                      checked={selectedAnswer === index}
                      onChange={() => chooseAnswer(index)}
                      data-testid={`input-career-answer-${index + 1}`}
                    />
                    <span className="career-choice-marker" aria-hidden="true">{selectedAnswer === index && <Check size={15} />}</span>
                    <span>{choice.label}</span>
                  </label>
                ))}
              </fieldset>
              <div className="career-quiz-actions">
                <button
                  className="career-back-button"
                  type="button"
                  onClick={() => currentQuestion === 0 ? setStage("intro") : setCurrentQuestion((index) => index - 1)}
                  data-testid="button-previous-question"
                >
                  <ArrowLeft size={16} /> {currentQuestion === 0 ? "Quay lại" : "Câu trước"}
                </button>
                <button
                  className="career-primary-button"
                  type="button"
                  onClick={continueToNext}
                  disabled={selectedAnswer === undefined}
                  data-testid="button-next-question"
                >
                  {currentQuestion === questions.length - 1 ? "Xem gợi ý của mình" : "Câu tiếp theo"} <ArrowRight size={17} />
                </button>
              </div>
            </section>
            <p className="career-privacy-line"><ShieldCheck size={15} /> Câu trả lời chỉ được giữ tạm trong phiên trình duyệt hiện tại; không gửi đi hay lưu lại.</p>
          </main>
        )}

        {stage === "results" && (
          <main className="career-results" data-testid="career-results-view">
            <div className="career-results-heading">
              <p className="career-eyebrow"><span /> NHỮNG HƯỚNG CÓ THỂ TÌM HIỂU</p>
              <h1>Không phải đáp án.<br /><em>Là những cánh cửa hé mở.</em></h1>
              <p className="career-results-intro" data-testid="text-results-summary">
                Dựa trên lựa chọn của bạn, đây là ba nhóm có nhiều điểm giao nhau nhất. Hãy xem chúng như gợi ý để khám phá thêm — sở thích và khả năng của bạn vẫn có thể đổi thay.
              </p>
            </div>
            <div className="career-results-list" aria-label="Ba hướng nghề nghiệp gợi ý" data-testid="list-career-matches">
              {ranked.map((profile, index) => {
                const Icon = profileIcons[profile.id];
                return (
                  <article className={`career-profile-card career-profile-${profile.id}`} key={profile.id} data-testid={`card-career-profile-${profile.id}`}>
                    <div className="career-profile-top">
                      <div className="career-profile-icon"><Icon size={20} aria-hidden="true" /></div>
                      <span className="career-profile-rank">{resultLabels[index]}</span>
                    </div>
                    <h2>{profile.name}</h2>
                    <p className="career-profile-summary">{profile.summary}</p>
                    <div className="career-result-columns">
                      <div>
                        <h3>Điểm mạnh có thể phát huy</h3>
                        <ul className="career-strength-list">{profile.strengths.map((strength) => <li key={strength}>{strength}</li>)}</ul>
                      </div>
                      <div>
                        <h3>Ví dụ nghề nghiệp</h3>
                        <div className="career-role-list">{profile.exampleRoles.map((role) => <span key={role}>{role}</span>)}</div>
                      </div>
                    </div>
                    <div className="career-next-steps">
                      <h3><Lightbulb size={15} /> Có thể thử tiếp</h3>
                      <ul>{profile.nextSteps.map((step) => <li key={step}>{step}</li>)}</ul>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="career-results-bottom">
              <p><strong>Bạn không cần quyết định ngay.</strong> Hãy chọn một việc nhỏ khiến bạn tò mò và thử trong tuần này.</p>
              <button className="career-primary-button" type="button" onClick={retake} data-testid="button-retake-exploration">
                <RotateCcw size={16} /> Làm lại từ đầu
              </button>
            </div>
            <p className="career-privacy-line"><ShieldCheck size={15} /> Câu trả lời chỉ được giữ tạm trong phiên trình duyệt hiện tại; không gửi đi hay lưu lại.</p>
          </main>
        )}
      </div>
    </div>
  );
}
