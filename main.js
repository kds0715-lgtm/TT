async function getOrdinanceId(municipalityQuery) {
    // target=ordin 확인
    const url = `https://www.law.go.kr/DRF/lawSearch.do?OC=${API_KEY}&target=ordin&query=${encodeURIComponent(municipalityQuery)}&type=XML&display=1`;
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        // [수정] 조례일련번호 -> 자치법규일련번호
        const mst = xmlDoc.querySelector('자치법규일련번호')?.textContent; 
        console.log(`${municipalityQuery} ID 찾음:`, mst);
        return mst;
    } catch (error) {
        console.error(`Error fetching ID for ${municipalityQuery}:`, error);
        return null;
    }
}

async function findArticlesInOrdinance(mst, keyword, municipalityName) {
    if (!mst) return [];
    // [수정] MST= -> ID= (자치법규 상세조회 시 ID 사용)
    const url = `https://www.law.go.kr/DRF/lawService.do?OC=${API_KEY}&target=ordin&ID=${mst}&type=XML`;
    try {
        const response = await fetch(url);
        if (!response.ok) return [];
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        // [수정] 자체법규명 -> 자치법규명칭
        const ordinanceTitle = xmlDoc.querySelector('자치법규명칭')?.textContent || '제목 없음';
        
        // [수정] 조문 -> 조문단위
        const articles = Array.from(xmlDoc.querySelectorAll('조문단위'));
        const matchingArticles = [];

        for (const article of articles) {
            // 조문내용 안에는 항, 호 내용이 포함되어 있습니다.
            const articleContent = article.querySelector('조문내용')?.textContent || '';
            
            if (articleContent.includes(keyword)) {
                // [수정] 조문제목 -> 조문번호 (조례는 보통 조문번호를 제목처럼 씁니다)
                const articleNum = article.getAttribute('조문번호') || '';
                matchingArticles.push({
                    municipality: municipalityName,
                    ordinanceTitle: ordinanceTitle,
                    articleTitle: `제${articleNum}조`,
                    articleContent: articleContent.trim(),
                });
            }
        }
        return matchingArticles;
    } catch (error) {
        console.error(`Error fetching content for ID ${mst}:`, error);
        return [];
    }
}