# GitHub 브랜치 컨벤션

본 문서는 프로젝트에서 일관된 브랜치 관리를 위해 정의된 브랜치 네이밍 및 사용 규칙을 제공합니다.

## 1. 브랜치 유형

| **브랜치 유형** | **설명**                                            | **네이밍 규칙**                  | **사용 예시**                       |
| --------------- | --------------------------------------------------- | -------------------------------- | ----------------------------------- |
| **`main`**      | 배포 가능한 안정된 코드 상태를 유지하는 브랜치      | `main`                           | `main`                              |
| **`develop`**   | 개발 중인 모든 기능이 통합되는 브랜치               | `develop`                        | `develop`                           |
| **`feature/`**  | 새로운 기능을 개발하기 위한 브랜치                  | `feature/<이슈번호>-<작업내용>`  | `feature/123-user-login`            |
| **`fix/`**      | 버그 수정을 위한 브랜치                             | `fix/<이슈번호>-<버그내용>`      | `fix/456-button-click-error`        |
| **`hotfix/`**   | 긴급 버그 수정을 위한 브랜치                        | `hotfix/<이슈번호>-<버그내용>`   | `hotfix/789-critical-payment-issue` |
| **`release/`**  | 릴리즈 준비를 위한 브랜치                           | `release/<버전>`                 | `release/v1.2.0`                    |
| **`chore/`**    | 설정, 문서, 빌드 작업 등 코드 외 작업을 위한 브랜치 | `chore/<이슈번호>-<작업내용>`    | `chore/101-update-readme`           |
| **`refactor/`** | 코드 리팩토링을 위한 브랜치                         | `refactor/<이슈번호>-<작업내용>` | `refactor/202-improve-performance`  |
| **`test/`**     | 테스트 코드 추가/수정을 위한 브랜치                 | `test/<이슈번호>-<테스트내용>`   | `test/303-add-unit-tests`           |

## 2. 브랜치 관리 규칙

### 브랜치 네이밍 규칙

1. 반드시 **소문자**만 사용하며, **슬래시**(`/`)로 카테고리를 구분합니다.
2. 띄어쓰기 대신 하이픈 `-`을 사용합니다. (**케밥 케이스**)
3. 작업 브랜치에는 관련된 **이슈 번호**가 존재하면 브랜치 이름에 이를 포함합니다.
    - 형식: `<브랜치 유형>/<이슈번호>-<작업내용>`
    - 예: `feature/123-user-login`
4. 작업 내용은 간결하고 명확히 작성하며, **동사로 시작**하는 것을 권장합니다.
5. 작업 범위를 명확히 하기 위해 너무 일반적인 이름은 피합니다.
    - 권장하지 않음: `feature/update`, `fix/bug`
    - 권장: `feature/update-user-profile`, `fix/fix-login-error`

### 브랜치 생성 및 병합 규칙

1. **`main` 브랜치**: 직접 수정 금지.
    - `develop` 브랜치에서 작업 후 Pull Request로 병합.
2. **`develop` 브랜치**: 직접 수정 금지.
    - 작업 브랜치(`feature/`, `fix/`)를 통해 병합.
3. **작업 시작 전 최신 브랜치로부터 새로 생성**

    ```bash
    git checkout develop
    git pull origin develop
    git checkout -b feature/<이슈번호>-<작업내용>
    ```

4. **브랜치 병합 및 삭제**
    - 작업 완료 후 Pull Request를 통해 병합한 브랜치는 반드시 삭제하여 깔끔한 브랜치 트리를 유지합니다.
    - `develop` 또는 `main`으로 병합 후 삭제
        ```bash
        git branch -d <브랜치명>
        git push origin --delete <브랜치명>
        ```
5. **이슈 번호 활용**
    - 이슈 번호를 통해 브랜치와 GitHub Issue를 쉽게 연관 지을 수 있습니다.
    - Pull Request 시 이슈 자동 닫기 가능: `Closes #<이슈번호>`

## 3. 브랜치 사용 예시 워크플로우

1. **작업 브랜치 생성**

    이슈 번호가 123번인 "사용자 로그인 기능 추가" 작업 시작

    ```bash
    git checkout develop
    git pull origin develop
    git checkout -b feature/123-user-login
    ```

2. **작업 완료 후 커밋 및 푸시**

    ```bash
    git add .
    git commit -m "feat(#123): 사용자 로그인 기능 추가"
    git push origin feature/123-user-login
    ```

3. **Pull Request 생성**
    - 브랜치: `feature/123-user-login`
    - 대상 브랜치: `develop`
    - PR 설명에 이슈 번호 포함
        ```
        Closes #123
        ```
4. **PR 병합 후 브랜치 삭제**

    ```bash
    git branch -d feature/123-user-login
    git push origin --delete feature/123-user-login
    ```
