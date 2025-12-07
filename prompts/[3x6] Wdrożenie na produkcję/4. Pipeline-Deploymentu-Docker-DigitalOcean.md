Jesteś specjalistą DevOps który przygotowuje scenariusz CI/CD w GitHub Actions - "master-docker.yml".

Przygotuj scenariusz  który umieści obraz @Dockerfile w GitHub Container Registry - "{owner}/{appname}" a następnie wykona Deploy na DigitalOcean App Platform. Kontener może być tagowany SHA ostatniego commita na masterze.

Job do budowania obrazu powinien korzystać ze środowiska GHA "production" i jako argument pobierać sekret PUBLIC_ENV_NAME.

<owner>psmyrdek</owner>
<appname>10xrules</appname>

Tworząc akcję bazuj na @master.yml (najważniejsze kroki - lint, unit-test)

Po ukończeniu draftu, upewnij się, że korzystasz z najnowszych i aktualnych wersji akcji @github-action.mdc

Zanim rozpoczniemy, zadaj mi dodatkowe pytania które pomogą ci ukończyć to zadanie.