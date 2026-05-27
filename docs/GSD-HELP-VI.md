# Tham Chiếu Lệnh GSD

**GSD** (Get Shit Done) tạo hệ thống kế hoạch dự án dạng phân cấp, tối ưu cho phát triển solo với agent AI.

## Bắt Đầu Nhanh

1. `$gsd-new-project` - Khởi tạo dự án, gồm nghiên cứu, yêu cầu và roadmap.
2. `$gsd-plan-phase 1` - Tạo kế hoạch chi tiết cho phase đầu tiên.
3. `$gsd-execute-phase 1` - Thực thi phase.

## Cập Nhật GSD

GSD thay đổi nhanh, nên cập nhật định kỳ:

```bash
npx get-shit-done-cc@latest
```

## Quy Trình Chính

```text
$gsd-new-project -> $gsd-plan-phase -> $gsd-execute-phase -> lặp lại
```

## Khởi Tạo Dự Án

### `$gsd-new-project`

Khởi tạo dự án mới qua một luồng thống nhất, từ ý tưởng đến trạng thái sẵn sàng lập kế hoạch.

Lệnh này hỗ trợ:

- Hỏi sâu để hiểu bạn đang xây gì.
- Nghiên cứu domain tùy chọn.
- Xác định yêu cầu với phạm vi v1, v2 và ngoài phạm vi.
- Tạo roadmap với phase, tiêu chí thành công và liên kết yêu cầu.

Tạo các artifact trong `.planning/`:

- `PROJECT.md` - tầm nhìn và yêu cầu.
- `config.json` - chế độ workflow.
- `research/` - nghiên cứu domain nếu được chọn.
- `REQUIREMENTS.md` - yêu cầu có mã REQ-ID.
- `ROADMAP.md` - phase ánh xạ với yêu cầu.
- `STATE.md` - bộ nhớ dự án.

Usage:

```bash
$gsd-new-project
```

### `$gsd-map-codebase [--fast] [--focus <area>] [--query <term>]`

Lập bản đồ codebase hiện có cho dự án brownfield.

- `--fast` - đánh giá nhanh, nhẹ.
- `--focus <area>` - chỉ phân tích một khu vực cụ thể.
- `--query <term>` - truy vấn chỉ mục hiểu biết codebase trong `.planning/intel/`.

Lệnh này tạo `.planning/codebase/` với các tài liệu về stack, kiến trúc, cấu trúc thư mục, convention, testing, tích hợp và rủi ro.

Usage:

```bash
$gsd-map-codebase
```

## Lập Kế Hoạch Phase

### `$gsd-discuss-phase <number> [--chain | --analyze | --power | --assumptions] [--batch[=N]]`

Giúp làm rõ cách bạn hình dung phase trước khi lập kế hoạch.

- `--chain` - luồng thảo luận theo chuỗi prompt.
- `--analyze` - phân tích giả định sâu hơn.
- `--power` - chế độ power-user với nhiều câu hỏi hơn.
- `--assumptions` - hiển thị các giả định triển khai mà agent đang có.
- `--batch` hoặc `--batch=N` - hỏi theo nhóm 2-5 câu thay vì từng câu.

Kết quả chính là `CONTEXT.md`, chứa tầm nhìn, điều bắt buộc và ranh giới của phase.

Usage:

```bash
$gsd-discuss-phase 2
$gsd-discuss-phase 2 --batch
$gsd-discuss-phase 2 --batch=3
```

### `$gsd-mvp-phase <number> [--force]`

Lập kế hoạch phase như một lát cắt MVP dọc. Lệnh hỏi theo cấu trúc user story: `As a / I want to / So that`, tách nhỏ bằng SPIDR nếu story quá lớn, rồi chuyển sang `$gsd-plan-phase` ở chế độ MVP.

- Ghi `**Mode:** mvp` vào phase trong `ROADMAP.md`.
- Thay `**Goal:**` bằng user story đã tạo.
- `--force` bỏ qua guard trạng thái nếu phase đã `in_progress` hoặc `completed`.

Usage:

```bash
$gsd-mvp-phase 1
$gsd-mvp-phase 2 --force
```

### `$gsd-plan-phase <number> [options]`

Tạo kế hoạch thực thi chi tiết cho một phase.

Các option thường dùng:

- `--skip-research` - bỏ qua researcher.
- `--research-phase <N>` - chỉ nghiên cứu phase N, ghi `RESEARCH.md`, rồi dừng.
- `--research` - ép refresh nghiên cứu.
- `--view` - in `RESEARCH.md` hiện có.
- `--gaps` - chỉ tập trung đóng gap từ lần kiểm tra kế hoạch trước.
- `--skip-verify` - bỏ qua vòng verifier sau khi lập kế hoạch.
- `--prd <file>` - dùng PRD làm context, bỏ qua discuss-phase.
- `--ingest <path-or-glob>` - nhập ADR làm context, bỏ qua discuss-phase.
- `--ingest-format <auto|nygard|madr|narrative>` - chỉ định định dạng ADR.
- `--tdd` - lập kế hoạch theo thứ tự test trước code.
- `--mvp` - chế độ lập kế hoạch MVP dọc.

Kết quả:

- Tạo `.planning/phases/XX-phase-name/XX-YY-PLAN.md`.
- Chia phase thành task cụ thể, có thể hành động.
- Có tiêu chí xác minh và đo thành công.
- Hỗ trợ nhiều plan trong cùng một phase.

Usage:

```bash
$gsd-plan-phase 1
$gsd-plan-phase --research-phase 2
$gsd-plan-phase --research-phase 2 --view
$gsd-plan-phase --research-phase 2 --research
```

## Thực Thi

### `$gsd-execute-phase <phase-number> [--wave N] [--gaps-only] [--tdd]`

Thực thi toàn bộ plan trong một phase hoặc chỉ một wave cụ thể.

- `--wave N` - chỉ chạy wave N.
- `--gaps-only` - chỉ chạy lại các plan được đánh dấu là gap.
- `--tdd` - bắt buộc thứ tự test-driven khi thực thi.

Lệnh sẽ nhóm plan theo wave, chạy từng wave tuần tự, xác minh mục tiêu phase sau khi hoàn tất, rồi cập nhật `REQUIREMENTS.md`, `ROADMAP.md` và `STATE.md`.

Usage:

```bash
$gsd-execute-phase 5
$gsd-execute-phase 5 --wave 2
```

## Router Thông Minh

### `$gsd-progress --do "<description>"`

Chuyển mô tả tự nhiên thành lệnh GSD phù hợp.

- Phân tích ý định bằng ngôn ngữ tự nhiên.
- Chỉ đóng vai trò dispatcher, không tự làm việc.
- Nếu mơ hồ, yêu cầu bạn chọn giữa các lệnh phù hợp nhất.

Usage:

```bash
$gsd-progress --do "fix the login button"
$gsd-progress --do "refactor the auth system"
$gsd-progress --do "I want to start a new milestone"
```

## Quick Mode Và Fast Mode

### `$gsd-quick [--full] [--validate] [--discuss] [--research]`

Thực thi task nhỏ với các bảo đảm của GSD nhưng bỏ bớt agent tùy chọn.

- Tạo quick task trong `.planning/quick/`.
- Cập nhật `STATE.md`, không cập nhật `ROADMAP.md`.
- Mặc định bỏ qua researcher, checker và verifier.

Flags:

- `--full` - đủ pipeline: discuss, research, plan-checking, verification.
- `--validate` - kiểm tra kế hoạch và xác minh sau thực thi.
- `--discuss` - thảo luận nhẹ trước khi lập kế hoạch.
- `--research` - nghiên cứu tập trung trước khi lập kế hoạch.

Usage:

```bash
$gsd-quick
$gsd-quick --full
$gsd-quick --research --validate
```

### `$gsd-fast [description]`

Thực thi task rất nhỏ ngay trong context hiện tại, không tạo plan file và không dùng subagent.

Phù hợp cho sửa typo, config nhỏ, thêm file đơn giản hoặc commit bị quên.

- Không tạo `PLAN.md` hoặc `SUMMARY.md`.
- Không spawn subagent.
- Tối đa khoảng 3 file edit; nếu task lớn hơn sẽ chuyển sang `$gsd-quick`.
- Commit nguyên tử với conventional message.

Usage:

```bash
$gsd-fast "fix the typo in README"
$gsd-fast "add .env to gitignore"
```

## Quản Lý Roadmap

### `$gsd-phase <description>`

Thêm phase mới vào cuối milestone hiện tại.

```bash
$gsd-phase "Add admin dashboard"
```

### `$gsd-phase --insert <after> <description>`

Chèn việc gấp giữa các phase hiện có bằng số thập phân, ví dụ phase 7.1 giữa 7 và 8.

```bash
$gsd-phase --insert 7 "Fix critical auth bug"
```

### `$gsd-phase --remove <number>`

Xóa phase tương lai chưa bắt đầu và đánh số lại các phase sau đó.

```bash
$gsd-phase --remove 17
```

### `$gsd-phase --edit <number> [--force]`

Sửa phase roadmap tại chỗ, giữ nguyên số và vị trí. `--force` cho phép sửa phase đã bắt đầu, cần dùng cẩn thận.

## Quản Lý Milestone

### `$gsd-new-milestone <name>`

Bắt đầu milestone mới qua luồng tương tự `$gsd-new-project`, dùng cho dự án đã có `PROJECT.md`.

```bash
$gsd-new-milestone "v2.0 Features"
$gsd-new-milestone --reset-phase-numbers "v2.0 Features"
```

### `$gsd-complete-milestone <version>`

Lưu trữ milestone đã hoàn tất và chuẩn bị cho phiên bản tiếp theo.

- Tạo entry trong `MILESTONES.md`.
- Lưu chi tiết vào thư mục milestones.
- Tạo git tag cho release.

```bash
$gsd-complete-milestone 1.0.0
```

## Theo Dõi Tiến Độ

### `$gsd-progress [--next | --forensic | --do "<description>"]`

Kiểm tra trạng thái dự án và định tuyến đến hành động tiếp theo.

- Hiển thị tiến độ và phần trăm hoàn thành.
- Tóm tắt công việc gần đây từ các file `SUMMARY`.
- Liệt kê quyết định quan trọng và vấn đề mở.
- Gợi ý thực thi plan tiếp theo hoặc tạo plan nếu thiếu.

Modes:

- Mặc định - báo cáo tiến độ và routing thông minh.
- `--next` - tự chuyển đến bước logic tiếp theo.
- `--forensic` - thêm audit toàn vẹn sau báo cáo.
- `--do "<text>"` - router ý định tự do.

Usage:

```bash
$gsd-progress
$gsd-progress --next
$gsd-progress --forensic
```

## Quản Lý Phiên Làm Việc

### `$gsd-resume-work`

Khôi phục context từ phiên trước.

- Đọc `STATE.md`.
- Hiển thị vị trí hiện tại và tiến độ gần đây.
- Đề xuất hành động tiếp theo.

```bash
$gsd-resume-work
```

### `$gsd-pause-work [--report]`

Tạo handoff khi tạm dừng giữa phase.

- `--report` - tạo báo cáo phiên trong `.planning/reports/`.
- Tạo `.continue-here`.
- Cập nhật phần continuity trong `STATE.md`.

```bash
$gsd-pause-work
```

## Debug

### `$gsd-debug [issue description] [--diagnose]`

Debug có hệ thống, lưu trạng thái để tiếp tục sau khi context bị reset.

- `--diagnose` - chạy một lượt chẩn đoán nhanh.
- Tạo `.planning/debug/[slug].md`.
- Điều tra theo hướng evidence -> hypothesis -> test.
- Chạy `$gsd-debug` không tham số để resume session đang mở.

Usage:

```bash
$gsd-debug "login button doesn't work"
$gsd-debug
```

## Spike Và Sketch

### `$gsd-spike [idea] [--quick]`

Thử nghiệm nhanh một ý tưởng để xác minh tính khả thi.

- Tách ý tưởng thành 2-5 thí nghiệm nhỏ theo mức rủi ro.
- Mỗi spike trả lời một câu Given/When/Then cụ thể.
- Lưu vào `.planning/spikes/`.
- `--quick` bỏ qua bước phân rã, build ngay.

```bash
$gsd-spike "can we stream LLM output over WebSockets?"
$gsd-spike --quick "test if pdfjs extracts tables"
```

### `$gsd-sketch [idea] [--quick]`

Phác thảo UI/design bằng mockup HTML throwaway, thường có nhiều biến thể.

- Hỏi mood/direction trước khi build.
- Mỗi sketch tạo 2-3 biến thể dạng tabbed HTML.
- Lưu vào `.planning/sketches/`.
- `--quick` nhảy thẳng vào build.

```bash
$gsd-sketch "dashboard layout for the admin panel"
$gsd-sketch --quick "form card grouping"
```

### `$gsd-spike --wrap-up`

Đóng gói kết quả spike thành skill dự án bền vững trong `./.codex/skills/`.

### `$gsd-sketch --wrap-up`

Đóng gói kết quả sketch thành skill thiết kế bền vững trong `./.codex/skills/`.

## Ghi Nhận Ý Tưởng, Note Và Todo

### `$gsd-capture [description]`

Ghi nhận ý tưởng hoặc task từ cuộc hội thoại hiện tại.

- Tạo todo trong `.planning/todos/pending/`.
- Suy luận area từ path file.
- Kiểm tra trùng lặp.
- Cập nhật số lượng todo trong `STATE.md`.

```bash
$gsd-capture
$gsd-capture Add auth token refresh
```

### `$gsd-capture --note <text>`

Ghi note nhanh, không hỏi thêm.

- Lưu note timestamp trong `.planning/notes/` hoặc `$HOME/.codex/notes/`.
- Có thể list hoặc promote note thành todo.

```bash
$gsd-capture --note refactor the hook system
$gsd-capture --note list
$gsd-capture --note promote 3
$gsd-capture --note --global cross-project idea
```

### `$gsd-capture --list [area]`

Liệt kê todo đang pending, có thể lọc theo area.

```bash
$gsd-capture --list
$gsd-capture --list api
```

### `$gsd-capture --seed [idea]`

Ghi một ý tưởng tương lai kèm điều kiện kích hoạt để tự nổi lên trong milestone phù hợp.

```bash
$gsd-capture --seed "add real-time notifications when we build the events system"
```

### `$gsd-capture --backlog [description]`

Thêm ý tưởng vào backlog parking lot cho milestone sau.

```bash
$gsd-capture --backlog "real-time notifications when events ship"
```

## UAT Và Ship

### `$gsd-verify-work [phase]`

Xác minh tính năng đã build bằng UAT hội thoại.

- Trích xuất deliverable có thể test từ `SUMMARY.md`.
- Hỏi từng test một.
- Nếu fail, tự chẩn đoán và tạo fix plan.

```bash
$gsd-verify-work 3
```

### `$gsd-ship [phase]`

Tạo PR từ phase đã hoàn tất.

- Push branch lên remote.
- Tạo PR body từ `SUMMARY.md`, `VERIFICATION.md`, `REQUIREMENTS.md`.
- Có thể yêu cầu code review.

Điều kiện: phase đã verified, `gh` CLI đã cài và authenticated.

```bash
$gsd-ship 4
$gsd-ship 4 --draft
```

## Review Và Nhánh PR

### `$gsd-review --phase N [--gemini] [--claude] [--codex] [--coderabbit] [--opencode] [--qwen] [--cursor] [--all]`

Yêu cầu nhiều AI CLI review độc lập kế hoạch phase.

- Phát hiện CLI có sẵn.
- Tạo `REVIEWS.md` với feedback từng reviewer và consensus.
- Dùng lại review để cải thiện kế hoạch.

```bash
$gsd-review --phase 3 --all
```

### `$gsd-pr-branch [target]`

Tạo branch sạch cho PR bằng cách lọc bỏ commit chỉ chứa `.planning/`.

- Commit code-only được giữ.
- Commit planning-only bị loại.
- Commit mixed được cherry-pick phần code, bỏ `.planning/`.

```bash
$gsd-pr-branch
$gsd-pr-branch main
```

## Audit Và Kiểm Định

### `$gsd-audit-uat`

Audit toàn bộ UAT và verification còn tồn đọng qua các phase.

- Quét pending, skipped, blocked và human_needed.
- Đối chiếu với codebase để phát hiện tài liệu stale.
- Tạo test plan ưu tiên cho con người.

```bash
$gsd-audit-uat
```

### `$gsd-audit-milestone [version]`

Audit milestone so với mục tiêu ban đầu.

- Đọc tất cả `VERIFICATION.md`.
- Kiểm tra coverage yêu cầu.
- Tạo `MILESTONE-AUDIT.md`.

```bash
$gsd-audit-milestone
```

## Cấu Hình

### `$gsd-settings`

Cấu hình workflow và model profile tương tác.

- Bật/tắt researcher, plan checker, verifier.
- Chọn model profile.
- Cập nhật `.planning/config.json`.

```bash
$gsd-settings
```

### `$gsd-config [--profile <profile> | --advanced | --integrations]`

Cấu hình nâng cao cho GSD.

- `--profile <profile>` - đổi nhanh profile: `quality`, `balanced`, `budget`, `inherit`.
- `--advanced` - tinh chỉnh nâng cao.
- `--integrations` - tích hợp API key, review CLI, agent skill.

Profiles:

- `quality` - ưu tiên chất lượng.
- `balanced` - cân bằng, mặc định.
- `budget` - tiết kiệm chi phí.
- `inherit` - dùng model của session hiện tại.

```bash
$gsd-config --profile budget
```

### `$gsd-surface [list|status|profile <name>|disable <cluster>|enable <cluster>|reset]`

Bật/tắt nhóm skill được surface.

```bash
$gsd-surface list
$gsd-surface profile standard
$gsd-surface disable utility
```

## Lệnh Tiện Ích

### `$gsd-cleanup`

Lưu trữ phase directory của milestone đã hoàn tất để giảm nhiễu trong `.planning/phases/`.

```bash
$gsd-cleanup
```

### `$gsd-help`

Hiển thị tài liệu tham chiếu lệnh GSD.

### `$gsd-update [--sync] [--reapply]`

Cập nhật GSD lên phiên bản mới nhất và xem changelog.

- `--sync` - đồng bộ skill GSD qua các runtime root.
- `--reapply` - áp lại chỉnh sửa local sau update.

```bash
$gsd-update
```

## Các Lệnh Bổ Sung

### Discovery Và Specification

- `$gsd-explore` - đào sâu ý tưởng theo kiểu Socratic trước khi lập kế hoạch.
- `$gsd-spec-phase <phase> [--auto] [--text]` - làm rõ phase sẽ deliver cái gì, tạo `SPEC.md`.
- `$gsd-ai-integration-phase [phase]` - tạo `AI-SPEC.md` cho phase có hệ thống AI.
- `$gsd-ui-phase [phase]` - tạo `UI-SPEC.md` cho phase frontend.
- `$gsd-import --from <filepath> | --from-gsd2` - nhập plan bên ngoài hoặc reverse-migrate từ GSD v2.
- `$gsd-ingest-docs [path] [--mode new|merge] [--manifest <file>] [--resolve auto|interactive]` - bootstrap hoặc merge `.planning/` từ ADR, PRD, SPEC và docs.

### Planning Và Execution

- `$gsd-ultraplan-phase [phase]` - beta: offload plan phase lên Claude Code ultraplan cloud.
- `$gsd-plan-review-convergence <phase> [options]` - vòng hội tụ kế hoạch bằng review từ nhiều AI đến khi hết concern HIGH.
- `$gsd-autonomous [--from N] [--to N] [--only N] [--interactive]` - chạy các phase còn lại tự động: discuss -> plan -> execute.

### Quality, Review Và Verification

- `$gsd-code-review <phase> [--depth=quick|standard|deep] [--files file1,file2,...] [--fix [--all] [--auto]]` - review code thay đổi trong phase.
- `$gsd-secure-phase [phase]` - xác minh mitigation bảo mật cho phase đã hoàn tất.
- `$gsd-validate-phase [phase]` - audit và bổ sung gap validation.
- `$gsd-ui-review [phase]` - audit UI theo 6 trụ cột.
- `$gsd-eval-review [phase]` - audit coverage evaluation cho phase AI.
- `$gsd-audit-fix --source <audit-uat> [--severity medium|high|all] [--max N] [--dry-run]` - pipeline audit-to-fix.
- `$gsd-add-tests <phase> [additional instructions]` - tạo test cho phase đã hoàn tất dựa trên UAT.

### Diagnostics Và Maintenance

- `$gsd-health [--repair] [--context]` - chẩn đoán và có thể sửa health của planning directory.
- `$gsd-forensics [problem description]` - điều tra sau lỗi workflow GSD.
- `$gsd-undo --last N | --phase NN | --plan NN-MM` - revert an toàn bằng phase manifest.
- `$gsd-docs-update [--force] [--verify-only]` - tạo hoặc cập nhật docs đã đối chiếu codebase.
- `$gsd-extract-learnings <phase>` - trích xuất quyết định, bài học và pattern từ phase.

### Knowledge Và Context

- `$gsd-graphify [build|query <term>|status|diff]` - xây, truy vấn và kiểm tra knowledge graph trong `.planning/graphs/`.
- `$gsd-thread [list [--open|--resolved] | close <slug> | status <slug> | name | description]` - quản lý thread context bền vững.
- `$gsd-profile-user [--questionnaire] [--refresh]` - tạo hồ sơ hành vi developer.
- `$gsd-stats` - hiển thị thống kê dự án.

### Workflow Và Orchestration

- `$gsd-manager [--analyze-deps]` - command center tương tác để quản lý nhiều phase.
- `$gsd-workspace [--new | --list | --remove] [name]` - quản lý workspace GSD tách biệt.
- `$gsd-workstreams` - quản lý workstream song song.
- `$gsd-review-backlog` - review và promote backlog item vào milestone hiện tại.
- `$gsd-milestone-summary [version]` - tạo tổng kết milestone.

### Repository Integration

- `$gsd-inbox [--issues] [--prs] [--label] [--close-incomplete] [--repo owner/repo]` - triage issue và PR GitHub.

### Namespace Router

Các router này chủ yếu giúp model định tuyến qua hơn 60 skill, nhưng bạn có thể gọi trực tiếp để duyệt theo nhóm.

- `$gsd-context` - routing cho codebase intelligence: map, graphify, docs, learnings.
- `$gsd-ideate` - routing cho explore, sketch, spike, spec, capture.
- `$gsd-manage` - routing cho config, workspace, thread, update, ship, inbox.
- `$gsd-project` - routing cho milestone, audit, summary.
- `$gsd-quality` - routing cho code review, debug, audit, security, eval, UI.
- `$gsd-workflow` - routing cho discuss, plan, execute, verify, phase, progress.

## Cấu Trúc File

```text
.planning/
├── PROJECT.md            # Tầm nhìn dự án
├── ROADMAP.md            # Phase hiện tại
├── STATE.md              # Bộ nhớ và context dự án
├── RETROSPECTIVE.md      # Retrospective sống
├── config.json           # Chế độ workflow và gate
├── todos/                # Ý tưởng và task đã capture
│   ├── pending/          # Todo chờ xử lý
│   └── done/             # Todo hoàn tất
├── spikes/               # Spike experiment
├── sketches/             # Sketch thiết kế
├── debug/                # Debug session đang mở
│   └── resolved/         # Issue đã resolve
├── milestones/           # Artifact milestone đã archive
├── codebase/             # Bản đồ codebase
└── phases/               # Plan và summary theo phase
```

## Workflow Modes

### Interactive Mode

- Xác nhận từng quyết định lớn.
- Dừng ở checkpoint để bạn duyệt.
- Có nhiều hướng dẫn hơn trong quá trình làm.

### YOLO Mode

- Tự duyệt hầu hết quyết định.
- Thực thi plan không cần xác nhận.
- Chỉ dừng ở checkpoint quan trọng.

Bạn có thể đổi mode bằng cách sửa `.planning/config.json`.

## Cấu Hình Planning

Trong `.planning/config.json`:

### `planning.commit_docs`

Mặc định: `true`.

- `true` - planning artifact được commit vào git.
- `false` - planning artifact chỉ local, không commit.

Khi `commit_docs: false`, nên thêm `.planning/` vào `.gitignore`.

### `planning.search_gitignored`

Mặc định: `false`.

- `true` - thêm `--no-ignore` vào các lần tìm kiếm rộng bằng ripgrep.
- Hữu ích khi `.planning/` bị gitignore nhưng bạn vẫn muốn search qua nó.

Ví dụ:

```json
{
  "planning": {
    "commit_docs": false,
    "search_gitignored": true
  }
}
```

## Workflow Thường Dùng

### Bắt đầu dự án mới

```bash
$gsd-new-project
$gsd-plan-phase 1
$gsd-execute-phase 1
```

### Tiếp tục sau khi nghỉ

```bash
$gsd-progress
```

### Thêm việc gấp giữa milestone

```bash
$gsd-phase --insert 5 "Critical security fix"
$gsd-plan-phase 5.1
$gsd-execute-phase 5.1
```

### Hoàn tất milestone

```bash
$gsd-complete-milestone 1.0.0
$gsd-new-milestone
```

### Capture ý tưởng trong lúc làm

```bash
$gsd-capture
$gsd-capture Fix modal z-index
$gsd-capture --note refactor auth system
$gsd-capture --seed "real-time notifications"
$gsd-capture --list
$gsd-capture --list api
```

### Debug issue

```bash
$gsd-debug "form submission fails silently"
$gsd-debug
```

## Khi Cần Trợ Giúp

- Đọc `.planning/PROJECT.md` để hiểu tầm nhìn dự án.
- Đọc `.planning/STATE.md` để xem context hiện tại.
- Kiểm tra `.planning/ROADMAP.md` để xem trạng thái phase.
- Chạy `$gsd-progress` để biết đang ở đâu và nên làm gì tiếp.
