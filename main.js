
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
    const resultsPerPage = 10;
    let currentQuery = {};

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
        citySelect.innerHTML = '<option value="">선택하세요</option>'; // Reset city dropdown

        if (selectedProvince && administrativeDistricts[selectedProvince]) {
            administrativeDistricts[selectedProvince].forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
        }
    });

    // Handle search button click
    searchButton.addEventListener('click', () => {
        const province = provinceSelect.value;
        const city = citySelect.value;
        const keyword = keywordInput.value.trim();
        const apiKey = apiKeyInput.value.trim();

        if (!province || !city) {
            alert('광역자치단체와 기초자치단체를 모두 선택해주세요.');
            return;
        }

        if (!apiKey) {
            alert('법령정보센터 오픈 API 키를 입력해주세요.');
            return;
        }

        currentQuery = { province, city, keyword, apiKey };
        currentPage = 1;
        searchOrdinances(currentQuery, currentPage);
    });

    async function searchOrdinances(query, page) {
        const { province, city, keyword, apiKey } = query;

        let ordinanceType = '도시계획 조례';
        if (city.endsWith('군') && city !== '군위군') {
            ordinanceType = '군계획 조례';
        } else if (city === '세종특별자치시') {
            ordinanceType = '도시계획 조례';
        }
        
        const fullAreaName = (province === city || city === '세종특별자치시') ? province : `${province} ${city}`;
        const searchArea = (province === '제주특별자치도') ? city : fullAreaName;

        let searchQuery = `${searchArea} ${ordinanceType}`;
        if (keyword) {
            searchQuery += ` ${keyword}`;
        }
        
        const encodedQuery = encodeURIComponent(searchQuery);
        const url = `https://www.law.go.kr/DRF/lawSearch.do?OC=${apiKey}&target=ordin&type=JSON&query=${encodedQuery}&display=${resultsPerPage}&page=${page}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.totalCnt === 0 || !data.law) {
                displayNoResults();
            } else {
                displayResults(data.law, data.totalCnt);
                displayPagination(data.totalCnt, page);
            }
        } catch (error) {
            console.error('Error fetching ordinances:', error);
            alert('조례 정보를 가져오는 데 실패했습니다. API 키 또는 네트워크 연결을 확인하세요.');
            resultsContainer.style.display = 'none';
        }
    }

    function displayResults(laws, totalCount) {
        resultsList.innerHTML = '';
        resultsContainer.style.display = 'block';
        
        resultsList.innerHTML = `<li><strong>총 ${totalCount}개의 결과를 찾았습니다.</strong></li><hr>`;

        laws.forEach(law => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <a href="https://www.law.go.kr/LSW/ordinInfoP.do?ordinSeq=${law.ordinSeq}" target="_blank">${law.자칙법규명}</a>
                <p>공포일자: ${law.공포일자} | 시행일자: ${law.시행일자 || '미정'}</p>
                <p>소관부처: ${law.소관부처명}</p>
            `;
            resultsList.appendChild(listItem);
        });
    }

    function displayNoResults() {
        resultsList.innerHTML = '<li>검색 결과가 없습니다.</li>';
        paginationContainer.innerHTML = '';
        resultsContainer.style.display = 'block';
    }

    function displayPagination(totalCount, currentPage) {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(totalCount / resultsPerPage);

        if (totalPages <= 1) return;

        // Simplified pagination: Previous and Next buttons
        if (currentPage > 1) {
            const prevButton = createPaginationButton('이전', currentPage - 1);
            paginationContainer.appendChild(prevButton);
        }

        const pageInfo = document.createElement('span');
        pageInfo.textContent = ` ${currentPage} / ${totalPages} `;
        pageInfo.style.margin = "0 10px";
        paginationContainer.appendChild(pageInfo);


        if (currentPage < totalPages) {
            const nextButton = createPaginationButton('다음', currentPage + 1);
            paginationContainer.appendChild(nextButton);
        }
    }

    function createPaginationButton(text, page) {
        const button = document.createElement('button');
        button.textContent = text;
        button.addEventListener('click', () => {
            currentPage = page;
            searchOrdinances(currentQuery, currentPage);
        });
        return button;
    }
});
