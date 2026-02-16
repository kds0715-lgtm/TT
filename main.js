const administrativeDistricts = {
    '서울특별시': ['종로구', '중구', '용산구', '성동구', '광진구', '동대문구', '중랑구', '성북구', '강북구', '도봉구', '노원구', '은평구', '서대문구', '마포구', '양천구', '강서구', '구로구', '금천구', '영등포구', '동작구', '관악구', '서초구', '강남구', '송파구', '강동구'],
    '부산광역시': ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'],
    '대구광역시': ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군', '군위군'],
    '인천광역시': ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'],
    '광주광역시': ['동구', '서구', '남구', '북구', '광산구'],
    '대전광역시': ['동구', '중구', '서구', '유성구', '대덕구'],
    '울산광역시': ['중구', '남구', '동구', '북구', '울주군'],
    '세종특별자치시': ['세종특별자치시'],
    '경기도': ['수원시', '성남시', '의정부시', '안양시', '부천시', '광명시', '평택시', '동두천시', '안산시', '고양시', '과천시', '구리시', '남양주시', '오산시', '시흥시', '군포시', '의왕시', '하남시', '용인시', '파주시', '이천시', '안성시', '김포시', '화성시', '광주시', '양주시', '포천시', '여주시', '연천군', '가평군', '양평군'],
    '강원특별자치도': ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'],
    '충청북도': ['청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'],
    '충청남도': ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'],
    '전북특별자치도': ['전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'],
    '전라남도': ['목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'],
    '경상북도': ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'],
    '경상남도': ['창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'],
    '제주특별자치도': ['제주시', '서귀포시'],
};

document.addEventListener('DOMContentLoaded', () => {
    const API_KEY = 'kds07153202';

    const provinceSelect = document.getElementById('province');
    const citySelect = document.getElementById('city');
    const keywordInput = document.getElementById('keyword');
    const searchButton = document.getElementById('search-button');
    const resultsContainer = document.getElementById('results-container');
    const resultsList = document.getElementById('results-list');
    const paginationContainer = document.getElementById('pagination');

    for (const province in administrativeDistricts) {
        const option = document.createElement('option');
        option.value = province;
        option.textContent = province;
        provinceSelect.appendChild(option);
    }

    provinceSelect.addEventListener('change', () => {
        const selectedProvince = provinceSelect.value;
        citySelect.innerHTML = '<option value="">전체</option>';
        if (selectedProvince && administrativeDistricts[selectedProvince]) {
            administrativeDistricts[selectedProvince].forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
        }
    });

    async function getOrdinanceId(municipalityQuery) {
        const url = `https://www.law.go.kr/DRF/lawSearch.do?OC=${API_KEY}&target=ordin&query=${encodeURIComponent(municipalityQuery)}&type=XML&display=1`;
        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            const mst = xmlDoc.querySelector('조례일련번호')?.textContent;
            return mst;
        } catch (error) {
            console.error(`Error fetching ID for ${municipalityQuery}:`, error);
            return null;
        }
    }

    async function findArticlesInOrdinance(mst, keyword, municipalityName) {
        if (!mst) return [];
        const url = `https://www.law.go.kr/DRF/lawService.do?OC=${API_KEY}&target=ordin&MST=${mst}&type=XML`;
        try {
            const response = await fetch(url);
            if (!response.ok) return [];
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

            const ordinanceTitle = xmlDoc.querySelector('기본정보 > 자체법규명')?.textContent || '제목 없음';
            const articles = Array.from(xmlDoc.querySelectorAll('조문'));
            const matchingArticles = [];

            for (const article of articles) {
                const articleContent = article.querySelector('조문내용')?.textContent || '';
                if (articleContent.includes(keyword)) {
                    const articleTitle = article.querySelector('조문제목')?.textContent || '제목 없음';
                    matchingArticles.push({
                        municipality: municipalityName,
                        ordinanceTitle: ordinanceTitle,
                        articleTitle: articleTitle,
                        articleContent: articleContent,
                    });
                }
            }
            return matchingArticles;
        } catch (error) {
            console.error(`Error fetching content for MST ${mst}:`, error);
            return [];
        }
    }

    async function processMunicipality(municipality, keyword) {
        let query;
        if (municipality === '세종특별자치시') {
            query = '세종특별자치시 도시군계획 조례';
        } else {
            const ordinanceType = municipality.endsWith('군') && municipality !== '군위군' ? '군계획 조례' : '도시계획 조례';
            query = `${municipality} ${ordinanceType}`;
        }
        
        const mst = await getOrdinanceId(query);
        if (!mst) return [];
        return await findArticlesInOrdinance(mst, keyword, municipality);
    }

    function displayResults(articles, keyword) {
        resultsList.innerHTML = '';
        paginationContainer.innerHTML = '';

        if (articles.length === 0) {
            resultsList.innerHTML = '<li>검색된 조문이 없습니다.</li>';
            return;
        }

        resultsContainer.querySelector('h2').textContent = `'${keyword}'에 대한 검색 결과: ${articles.length}개 조문`;

        articles.forEach(article => {
            const item = document.createElement('div');
            item.className = 'accordion-item';

            const button = document.createElement('button');
            button.className = 'accordion-button';
            button.innerHTML = `
                <span class="accordion-title-area">
                    <span class="municipality-badge">${article.municipality}</span>
                    ${article.ordinanceTitle}
                </span>
                <span class="accordion-icon"></span>
            `;

            const panel = document.createElement('div');
            panel.className = 'accordion-panel';

            const panelContent = document.createElement('div');
            panelContent.className = 'accordion-panel-content';
            const highlightedContent = article.articleContent.replace(new RegExp(keyword, 'g'), `<mark>${keyword}</mark>`);
            panelContent.innerHTML = `
                <p class="article-title">${article.articleTitle}</p>
                <pre class="article-content">${highlightedContent}</pre>
            `;

            panel.appendChild(panelContent);
            item.appendChild(button);
            item.appendChild(panel);
            resultsList.appendChild(item);

            button.addEventListener('click', () => {
                button.classList.toggle('active');
                const panel = button.nextElementSibling;
                if (panel.style.maxHeight) {
                    panel.style.maxHeight = null;
                } else {
                    panel.style.maxHeight = panel.scrollHeight + "px";
                }
            });
        });
    }

    async function runKeywordSearch() {
        const keyword = keywordInput.value.trim();
        if (!keyword) {
            alert('검색어를 입력해주세요.');
            return;
        }

        searchButton.disabled = true;
        searchButton.textContent = '검색 중...';
        resultsContainer.style.display = 'block';
        paginationContainer.innerHTML = '';
        resultsList.innerHTML = '<li>지자체 조례 목록을 가져와 검색을 준비하고 있습니다...</li>';

        let municipalitiesToSearch = [];
        const selectedProvince = provinceSelect.value;
        const selectedCity = citySelect.value;

        if (!selectedProvince) {
            municipalitiesToSearch = Object.values(administrativeDistricts).flat();
            resultsList.innerHTML = `<li>전국 ${municipalitiesToSearch.length}개 지자체의 조례를 검색 중입니다. 잠시만 기다려주세요...</li>`;
        } else if (!selectedCity || selectedCity === '전체') {
            municipalitiesToSearch = administrativeDistricts[selectedProvince];
        } else {
            municipalitiesToSearch = [selectedCity];
        }
        
        try {
            const allPromises = municipalitiesToSearch.map(city => processMunicipality(city, keyword));
            const resultsFromAllMunicipalities = await Promise.all(allPromises);
            const allMatchingArticles = resultsFromAllMunicipalities.flat();

            allMatchingArticles.sort((a, b) => a.municipality.localeCompare(b.municipality));

            displayResults(allMatchingArticles, keyword);

        } catch (error) {
            console.error('An error occurred during the search:', error);
            resultsList.innerHTML = '<li>검색 중 오류가 발생했습니다.</li>';
        }

        searchButton.disabled = false;
        searchButton.textContent = '검색';
    }

    searchButton.addEventListener('click', runKeywordSearch);
});
