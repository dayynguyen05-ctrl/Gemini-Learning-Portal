import {
  db,
  faqCategoriesTable,
  faqItemsTable,
  hotlinesTable,
  resourcesTable,
} from "@workspace/db";

const starterResources = [
  {
    title: "Cách chia nhỏ bài tập khi thấy quá tải",
    summary: "Biến một danh sách bài vở dài thành những bước ngắn, cụ thể và dễ bắt đầu.",
    content: [
      "Khi có quá nhiều việc, não thường khó chọn điểm bắt đầu. Hãy dành vài phút viết tất cả việc cần làm ra giấy, chưa cần sắp xếp.",
      "Gạch dưới việc gần hạn nhất hoặc ảnh hưởng nhiều nhất. Chia việc đó thành một hành động nhỏ có thể hoàn thành trong 10–20 phút, chẳng hạn đọc hai trang hoặc làm ba câu đầu.",
      "Sau mỗi lượt tập trung, nghỉ ngắn, uống nước hoặc đứng dậy vận động. Khi xong một bước, đánh dấu lại rồi chọn bước tiếp theo.",
      "Nếu kế hoạch vẫn không vừa thời gian, hãy trao đổi với giáo viên, gia đình hoặc người bạn tin cậy để cùng sắp xếp lại. Nghỉ ngơi cũng là một phần của kế hoạch học tập.",
    ].join("\n"),
    category: "Học tập",
    tags: ["lập kế hoạch", "giảm quá tải", "tập trung"],
    readMinutes: 4,
    featured: true,
  },
  {
    title: "Ôn thi hiệu quả với kế hoạch 7 ngày",
    summary: "Một khung ôn tập linh hoạt để bạn ôn kiến thức, luyện đề và vẫn có thời gian nghỉ.",
    content: [
      "Ngày 1: Liệt kê chủ đề cần ôn và đánh dấu phần còn chưa chắc. Chia nội dung thành các nhóm nhỏ.",
      "Ngày 2–4: Mỗi ngày học một vài nhóm chủ đề. Sau khi đọc lại, hãy tự trả lời câu hỏi hoặc làm bài tập mà không nhìn tài liệu.",
      "Ngày 5: Làm bài luyện tập trong khoảng thời gian phù hợp, sau đó xem lại lỗi sai để biết phần nào cần ôn thêm.",
      "Ngày 6: Ôn lại các ý chính và hỏi giáo viên hoặc bạn học về điều còn vướng.",
      "Ngày 7: Chuẩn bị dụng cụ, xem nhanh ghi chú và ngủ đủ. Không cần thức khuya để cố nhồi toàn bộ kiến thức.",
      "Điều chỉnh kế hoạch theo lịch học và sức khỏe của bạn. Một kế hoạch thực tế hữu ích hơn một lịch kín không thể theo được.",
    ].join("\n"),
    category: "Học tập",
    tags: ["ôn thi", "lịch học", "thói quen"],
    readMinutes: 5,
    featured: true,
  },
  {
    title: "Bắt đầu học khi bạn khó tập trung",
    summary: "Một vài cách đơn giản để giảm xao nhãng và bắt đầu bằng việc nhỏ nhất.",
    content: [
      "Chọn một việc cụ thể thay vì đặt mục tiêu chung như “học cả buổi”. Ví dụ: mở vở và làm câu đầu tiên.",
      "Để điện thoại xa tầm tay hoặc bật chế độ yên lặng trong một khoảng thời gian ngắn. Chuẩn bị sẵn sách, nước uống và dụng cụ để không phải đứng lên tìm giữa chừng.",
      "Thử tập trung 20–25 phút rồi nghỉ vài phút. Nếu khoảng thời gian đó quá dài, hãy bắt đầu bằng 10 phút và tăng dần khi thấy phù hợp.",
      "Nếu đầu óc vẫn phân tán, ghi nhanh điều đang làm bạn bận tâm rồi quay lại một bước nhỏ. Khó tập trung đôi khi là dấu hiệu bạn cần nghỉ hoặc cần nhờ người khác hỗ trợ.",
    ].join("\n"),
    category: "Học tập",
    tags: ["tập trung", "giảm xao nhãng", "bắt đầu"],
    readMinutes: 4,
    featured: true,
  },
  {
    title: "Khi cảm xúc trở nên quá tải",
    summary: "Một hướng dẫn nhẹ nhàng để tạm dừng, nhận biết cảm xúc và tìm người đồng hành.",
    content: [
      "Bạn không cần phải giải quyết mọi chuyện ngay lập tức. Nếu có thể, hãy tìm một nơi an toàn, đặt hai chân xuống sàn và để ý những gì đang diễn ra xung quanh.",
      "Thử gọi tên cảm xúc bằng một từ gần đúng như lo lắng, buồn, tức giận hoặc bối rối. Hít vào chậm và thở ra nhẹ nhàng vài lần nếu điều đó khiến bạn thấy dễ chịu.",
      "Chọn một việc chăm sóc bản thân nhỏ: uống nước, đi bộ ngắn, viết ra điều đang nghĩ hoặc nhắn cho người bạn tin cậy.",
      "Nếu cảm giác kéo dài, ảnh hưởng đến sinh hoạt hoặc bạn thấy mình không an toàn, hãy nói với người lớn đáng tin cậy và tìm sự trợ giúp chuyên môn. Nội dung này không thay thế tư vấn y tế.",
    ].join("\n"),
    category: "Tâm lý",
    tags: ["cảm xúc", "tự chăm sóc", "tìm hỗ trợ"],
    readMinutes: 4,
    featured: true,
  },
  {
    title: "Đối diện lo lắng trước buổi kiểm tra",
    summary: "Chuẩn bị theo từng bước và dùng những cách bình tĩnh phù hợp với bạn.",
    content: [
      "Lo lắng trước bài kiểm tra là điều nhiều người trải qua. Hãy tách phần mình kiểm soát được khỏi phần chưa thể biết: bạn có thể chuẩn bị dụng cụ, xem lại ghi chú và ngủ đúng giờ.",
      "Trong lúc ôn, ưu tiên tự kiểm tra kiến thức bằng câu hỏi ngắn hoặc bài tập thay vì chỉ đọc đi đọc lại. Ghi lại những phần chưa rõ để hỏi thầy cô.",
      "Khi bắt đầu bài, đọc hết yêu cầu, làm câu bạn biết trước và quay lại câu khó sau. Nếu thấy căng thẳng, tạm dừng vài giây, thả lỏng vai và thở chậm.",
      "Một bài kiểm tra không quyết định toàn bộ giá trị hay tương lai của bạn. Nếu lo lắng thường xuyên cản trở việc học hoặc giấc ngủ, hãy chia sẻ với người bạn tin cậy.",
    ].join("\n"),
    category: "Tâm lý",
    tags: ["lo lắng", "kiểm tra", "sức khỏe tinh thần"],
    readMinutes: 4,
    featured: false,
  },
  {
    title: "Nói chuyện khi có mâu thuẫn với bạn bè",
    summary: "Cách trình bày điều bạn cảm thấy, lắng nghe và giữ ranh giới an toàn.",
    content: [
      "Nếu cả hai đang quá tức giận, hãy xin tạm dừng và hẹn nói lại khi bình tĩnh hơn. Không cần ép mình giải quyết ngay.",
      "Dùng câu bắt đầu bằng “Mình cảm thấy…” để nói về trải nghiệm của bạn, rồi nêu một việc cụ thể đã xảy ra và điều bạn mong muốn. Tránh kết luận về tính cách hay động cơ của người kia.",
      "Lắng nghe điều bạn mình muốn nói, nhưng bạn không cần đồng ý với mọi thứ. Bạn có thể đặt ranh giới rõ ràng và lịch sự.",
      "Nếu có đe dọa, bắt nạt hoặc bạn cảm thấy không an toàn, hãy nói với giáo viên, gia đình hoặc người lớn đáng tin cậy. Đừng tự xử lý một mình.",
    ].join("\n"),
    category: "Quan hệ xã hội",
    tags: ["giao tiếp", "tình bạn", "ranh giới"],
    readMinutes: 4,
    featured: false,
  },
  {
    title: "Xây dựng nhịp ngủ phù hợp với ngày học",
    summary: "Một số thói quen nhỏ giúp bạn chuẩn bị cho giấc ngủ và buổi sáng dễ dàng hơn.",
    content: [
      "Thử giữ giờ thức dậy tương đối ổn định và dành thời gian thư giãn trước khi ngủ. Thói quen đều đặn thường dễ duy trì hơn việc thay đổi mọi thứ cùng lúc.",
      "Nếu có thể, giảm ánh sáng màn hình trước giờ ngủ và tránh uống nhiều đồ uống có caffeine vào buổi chiều tối. Tạo môi trường yên tĩnh, thoáng mát theo điều kiện của bạn.",
      "Chuẩn bị sách vở hoặc quần áo cho ngày mai trước khi nghỉ để buổi sáng bớt vội.",
      "Nhu cầu ngủ khác nhau theo độ tuổi và mỗi người. Nếu khó ngủ kéo dài hoặc ảnh hưởng nhiều đến sinh hoạt, hãy trao đổi với gia đình và nhân viên y tế.",
    ].join("\n"),
    category: "Sức khỏe",
    tags: ["giấc ngủ", "thói quen", "sức khỏe"],
    readMinutes: 4,
    featured: false,
  },
  {
    title: "Khám phá nghề nghiệp bằng trải nghiệm nhỏ",
    summary: "Tìm hiểu sở thích và thế mạnh qua những thử nghiệm thực tế, không cần quyết định vội.",
    content: [
      "Hãy ghi lại những hoạt động khiến bạn tò mò, những việc bạn làm tốt và điều bạn muốn đóng góp cho cộng đồng. Đây là gợi ý để khám phá, không phải bài kiểm tra quyết định nghề nghiệp.",
      "Chọn một trải nghiệm nhỏ: tham gia câu lạc bộ, làm dự án cá nhân, hỏi chuyện người đang làm nghề bạn quan tâm hoặc tìm hiểu một môn học mới.",
      "Sau trải nghiệm, tự hỏi điều gì làm bạn hứng thú, điều gì khó và bạn muốn học thêm kỹ năng nào. Sở thích và lựa chọn có thể thay đổi theo thời gian.",
      "Trao đổi với gia đình, giáo viên hướng nghiệp hoặc người có kinh nghiệm. Hãy cân nhắc cả điều kiện học tập, cơ hội và mong muốn của chính bạn.",
    ].join("\n"),
    category: "Học tập",
    tags: ["hướng nghiệp", "khám phá bản thân", "kỹ năng"],
    readMinutes: 4,
    featured: false,
  },
];

const starterHotlines = [
  {
    name: "Tổng đài khẩn cấp quốc gia",
    phone: "112",
    description: "Tiếp nhận 24/7 thông tin về sự cố, thiên tai, thảm họa, tai nạn và tình huống nguy cấp cần trợ giúp trên phạm vi toàn quốc.",
    available24h: true,
    category: "Khẩn cấp quốc gia",
  },
  {
    name: "Tổng đài quốc gia bảo vệ trẻ em",
    phone: "111",
    description: "Tiếp nhận thông tin và hỗ trợ các vấn đề liên quan đến trẻ em, bao gồm bạo lực, xâm hại hoặc nguy cơ mất an toàn. Miễn phí, hoạt động 24/7.",
    available24h: true,
    category: "Bảo vệ trẻ em",
  },
  {
    name: "Cấp cứu y tế",
    phone: "115",
    description: "Gọi khi cần cấp cứu y tế khẩn cấp. Nếu có thể, nói rõ địa điểm và tình trạng để nhân viên tiếp nhận hướng dẫn.",
    available24h: true,
    category: "Y tế khẩn cấp",
  },
  {
    name: "Công an",
    phone: "113",
    description: "Gọi khi đang gặp nguy hiểm hoặc cần hỗ trợ khẩn cấp về an ninh, trật tự.",
    available24h: true,
    category: "An ninh",
  },
  {
    name: "Cứu hỏa và cứu nạn, cứu hộ",
    phone: "114",
    description: "Gọi khi xảy ra cháy hoặc cần lực lượng cứu nạn, cứu hộ khẩn cấp.",
    available24h: true,
    category: "Cứu nạn, cứu hộ",
  },
];

const starterFaq = [
  {
    name: "Sử dụng Điểm Tựa Học Đường",
    items: [
      {
        question: "Tôi có thể dùng những tính năng nào?",
        answer: "Bạn có thể xem tài liệu, ghi nhận cảm xúc, trò chuyện, tham gia cộng đồng, nghe nhạc thư giãn, học từ vựng và khám phá hướng nghiệp. Một số tính năng lưu tiến độ cần đăng nhập.",
      },
      {
        question: "Tôi có thể xóa cuộc trò chuyện không?",
        answer: "Có. Trong trang trò chuyện, chọn cuộc hội thoại muốn xóa và dùng tùy chọn xóa. Hãy kiểm tra lại trước khi xác nhận vì nội dung đã xóa có thể không khôi phục được.",
      },
      {
        question: "Tôi nên chia sẻ thông tin gì với chatbot?",
        answer: "Bạn có thể mô tả tình huống chung để nhận gợi ý. Tránh gửi mật khẩu, địa chỉ nhà, số điện thoại hoặc thông tin riêng tư của bạn và người khác.",
      },
      {
        question: "Chatbot có thay thế chuyên gia không?",
        answer: "Không. Chatbot chỉ hỗ trợ trò chuyện và gợi ý chung; không thay thế chuyên gia tâm lý, bác sĩ, giáo viên hoặc dịch vụ khẩn cấp.",
      },
    ],
  },
  {
    name: "Học tập và chăm sóc bản thân",
    items: [
      {
        question: "Làm sao bắt đầu khi có quá nhiều bài?",
        answer: "Viết các việc cần làm ra giấy, chọn việc gần hạn nhất rồi chia thành bước nhỏ có thể làm trong 10–20 phút. Nếu kế hoạch không thực tế, hãy hỏi giáo viên hoặc người thân để cùng sắp xếp lại.",
      },
      {
        question: "Tôi có thể ghi nhận cảm xúc ở đâu?",
        answer: "Mở mục “Ghi nhận cảm xúc”, chọn trạng thái gần với cảm nhận hiện tại và thêm ghi chú nếu muốn. Việc ghi lại không phải chẩn đoán sức khỏe.",
      },
      {
        question: "Làm sao duy trì chuỗi học tập?",
        answer: "Đăng nhập rồi chọn điểm danh trong thẻ chuỗi học tập sau khi bạn đã học. Hãy đặt mục tiêu vừa sức; nghỉ ngơi khi cần cũng quan trọng.",
      },
      {
        question: "Tôi chưa biết chọn nghề nào thì sao?",
        answer: "Bạn không cần quyết định ngay. Hãy thử các hoạt động nhỏ, tìm hiểu môn học và nghề nghiệp khác nhau, rồi trao đổi với người lớn hoặc giáo viên hướng nghiệp.",
      },
    ],
  },
  {
    name: "An toàn và hỗ trợ",
    items: [
      {
        question: "Tôi nên làm gì nếu đang gặp nguy hiểm?",
        answer: "Đến nơi an toàn và gọi người lớn đáng tin cậy. Nếu cần trợ giúp khẩn cấp tại Việt Nam, gọi 113 khi nguy hiểm về an ninh, 115 khi cần cấp cứu y tế, hoặc 114 khi có cháy/cứu nạn. Trẻ em có thể gọi tổng đài 111.",
      },
      {
        question: "Số 112 hỗ trợ những tình huống nào?",
        answer: "Tổng đài khẩn cấp quốc gia 112 tiếp nhận 24/7 thông tin về sự cố, thiên tai, thảm họa, tai nạn và tình huống nguy cấp cần trợ giúp trên phạm vi toàn quốc.",
      },
      {
        question: "Tôi có thể báo khi bị bắt nạt không?",
        answer: "Có. Hãy lưu lại thông tin cần thiết nếu an toàn để làm vậy, rồi nói với giáo viên, gia đình hoặc người lớn đáng tin cậy. Nếu có nguy cơ tức thời, hãy tìm nơi an toàn và gọi hỗ trợ khẩn cấp.",
      },
      {
        question: "Cộng đồng có phải nơi xử lý khủng hoảng không?",
        answer: "Không. Cộng đồng dành cho chia sẻ và hỗ trợ lẫn nhau, không phải dịch vụ khẩn cấp. Khi bạn hoặc người khác không an toàn, hãy liên hệ người lớn đáng tin cậy và đường dây hỗ trợ phù hợp.",
      },
      {
        question: "Nếu cảm thấy buồn hoặc lo lắng kéo dài thì sao?",
        answer: "Hãy chia sẻ với người bạn tin tưởng như người thân, giáo viên hoặc nhân viên y tế. Nếu bạn nghĩ mình có thể làm hại bản thân hoặc người khác, hãy tìm người ở cạnh ngay và gọi dịch vụ khẩn cấp.",
      },
    ],
  },
];

export async function ensureStarterContent(): Promise<void> {
  await db.transaction(async (tx) => {
    const existingResources = await tx
      .select({ title: resourcesTable.title })
      .from(resourcesTable)
    const existingResourceTitles = new Set(existingResources.map(({ title }) => title));
    const missingResources = starterResources.filter(
      ({ title }) => !existingResourceTitles.has(title),
    );
    if (missingResources.length > 0) {
      await tx.insert(resourcesTable).values(missingResources);
    }

    const existingHotlines = await tx
      .select({ phone: hotlinesTable.phone })
      .from(hotlinesTable);
    const existingPhones = new Set(existingHotlines.map(({ phone }) => phone));
    const missingHotlines = starterHotlines.filter(
      ({ phone }) => !existingPhones.has(phone),
    );
    if (missingHotlines.length > 0) {
      await tx.insert(hotlinesTable).values(missingHotlines);
    }

    const existingFaqCategories = await tx
      .select({ id: faqCategoriesTable.id, name: faqCategoriesTable.name })
      .from(faqCategoriesTable)
    const existingFaqItems = await tx
      .select({
        categoryId: faqItemsTable.categoryId,
        question: faqItemsTable.question,
      })
      .from(faqItemsTable);
    if (existingFaqCategories.length === 0 && existingFaqItems.length === 0) {
      for (const [categoryIndex, category] of starterFaq.entries()) {
        const [insertedCategory] = await tx
          .insert(faqCategoriesTable)
          .values({ name: category.name, sortOrder: categoryIndex })
          .returning({ id: faqCategoriesTable.id });

        await tx.insert(faqItemsTable).values(
          category.items.map((item, itemIndex) => ({
            categoryId: insertedCategory.id,
            question: item.question,
            answer: item.answer,
            sortOrder: itemIndex,
          })),
        );
      }
    } else {
      for (const category of starterFaq) {
        const existingCategory = existingFaqCategories.find(
          ({ name }) => name === category.name,
        );
        if (!existingCategory) continue;
        const existingQuestions = new Set(
          existingFaqItems
            .filter(({ categoryId }) => categoryId === existingCategory.id)
            .map(({ question }) => question),
        );
        const missingItems = category.items
          .map((item, itemIndex) => ({ ...item, sortOrder: itemIndex }))
          .filter(({ question }) => !existingQuestions.has(question))
          .map((item) => ({ ...item, categoryId: existingCategory.id }));
        if (missingItems.length > 0) {
          await tx.insert(faqItemsTable).values(missingItems);
        }
      }
    }
  });
}
