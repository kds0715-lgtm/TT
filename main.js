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
    const provinceSelect = document.getElementById('province');
    const citySelect = document.getElementById('city');
    const keywordInput = document.getElementById('keyword');
    const apiKeyInput = document.getElementById('api-key');
    const searchButton = document.getElementById('search-button');
    const resultsContainer = document.getElementById('results-container');
    const resultsList = document.getElementById('results-list');
    const paginationContainer = document.getElementById('pagination');

    let currentPage = 1;
    let totalPages = 0;
    let currentQuery = '';

    // Populate province dropdown
    for (const province in administrativeDistricts) {
        const option = document.createElement('option');
        option.value = province;
        option.textContent = province;
        provinceSelect.appendChild(option);
    }

    // Handle province change
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

    async function fetchOrdinances(query, page = 1) {
        const apiKey = apiKeyInput.value;
        if (!apiKey) {
            alert('API 키를 입력하세요.');
            return null;
        }

        const url = `https://www.law.go.kr/DRF/lawSearch.do?OC=${apiKey}&target=ordin&type=XML&query=${encodeURIComponent(query)}&display=10&page=${page}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            return xmlDoc;
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('데이터를 불러오는 데 실패했습니다. API 키나 네트워크 연결을 확인하세요.');
            return null;
        }
    }

    function displayResults(items) {
        resultsList.innerHTML = '';
        if (items.length === 0) {
            resultsList.innerHTML = '<li>검색 결과가 없습니다.</li>';
            return;
        }

        items.forEach(item => {
            const li = document.createElement('li');
            const title = item.querySelector('조례명')?.textContent || '제목 없음';
            const link = item.querySelector('조례상세링크')?.textContent;
            const promulgationDate = item.querySelector('공포일자')?.textContent;
            const promulgationNum = item.querySelector('공포번호')?.textContent;

            li.innerHTML = `
                <a href="https://www.law.go.kr${link}" target="_blank">${title}</a>
                <p>공포번호: ${promulgationNum} | 공포일자: ${promulgationDate}</p>
            `;
            resultsList.appendChild(li);
        });
    }

    function setupPagination(totalCount) {
        paginationContainer.innerHTML = '';
        totalPages = Math.ceil(totalCount / 10);

        if (totalPages <= 1) return;

        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement('button');
            button.textContent = i;
            if (i === currentPage) {
                button.classList.add('active');
            }
            button.addEventListener('click', () => {
                currentPage = i;
                performSearch(currentQuery, currentPage);
            });
            paginationContainer.appendChild(button);
        }
    }

    async function performSearch(query, page = 1) {
        searchButton.disabled = true;
        searchButton.textContent = '검색 중...';
        resultsContainer.style.display = 'block';
        resultsList.innerHTML = '<li>검색 중...</li>';
        
        const xmlDoc = await fetchOrdinances(query, page);

        if (xmlDoc) {
            const totalCnt = parseInt(xmlDoc.querySelector('totalCnt')?.textContent || '0', 10);
            const items = xmlDoc.querySelectorAll('ordin');
            
            displayResults(Array.from(items));
            if(page === 1) setupPagination(totalCnt);
        } else {
            resultsList.innerHTML = '<li>검색에 실패했습니다.</li>';
        }

        searchButton.disabled = false;
        searchButton.textContent = '검색';
    }
    
    async function performNationwideSearch(keyword, page = 1) {
        searchButton.disabled = true;
        searchButton.textContent = '검색 중...';
        resultsContainer.style.display = 'block';
        resultsList.innerHTML = '<li>전국 단위 검색 중...</li>';

        const query1 = `도시계획 조례 ${keyword}`;
        const query2 = `군계획 조례 ${keyword}`;

        // Fetch both queries concurrently
        const [xmlDoc1, xmlDoc2] = await Promise.all([
            fetchOrdinances(query1, page),
            fetchOrdinances(query2, page)
        ]);

        let allItems = [];
        let totalCount = 0;

        if (xmlDoc1) {
            totalCount += parseInt(xmlDoc1.querySelector('totalCnt')?.textContent || '0', 10);
            allItems.push(...Array.from(xmlDoc1.querySelectorAll('ordin')));
        }
        if (xmlDoc2) {
            totalCount += parseInt(xmlDoc2.querySelector('totalCnt')?.textContent || '0', 10);
            allItems.push(...Array.from(xmlDoc2.querySelectorAll('ordin')));
        }

        // Simple sort by promulgation date (descending)
        allItems.sort((a, b) => {
            const dateA = a.querySelector('공포일자')?.textContent || '0';
            const dateB = b.querySelector('공포일자')?.textContent || '0';
            return dateB.localeCompare(dateA);
        });

        displayResults(allItems);
        // Note: Pagination for combined results is complex and might not be perfectly accurate 
        // as we are combining two separate queries. This is a simplified approach.
        if(page === 1) setupPagination(totalCount);

        searchButton.disabled = false;
        searchButton.textContent = '검색';
    }

    searchButton.addEventListener('click', () => {
        const province = provinceSelect.value;
        const city = citySelect.value;
        const keyword = keywordInput.value.trim();

        if (!keyword) {
            alert('검색어를 입력해주세요.');
            return;
        }

        currentPage = 1;
        
        if (!province) {
            // Nationwide search
            currentQuery = `도시계획 조례 ${keyword}` + `군계획 조례 ${keyword}`; // Store a representation of the query
            performNationwideSearch(keyword, currentPage);
        } else {
            // Region-specific search
            let area = province;
            if (city) {
                 area = (province === city || city === '세종특별자치시') ? province : `${province} ${city}`;
            }
            const ordinanceType = (city && city.endsWith('군') && city !== '군위군') ? '군계획 조례' : '도시계획 조례';
            
            currentQuery = `${area} ${ordinanceType} ${keyword}`;
            performSearch(currentQuery, currentPage);
        }
    });
});
