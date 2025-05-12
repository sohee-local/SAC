import feedparser 
import xml.etree.ElementTree as ET

# RSS 피드 파싱
rss_url = "https://www.chosun.com/arc/outboundfeeds/rss/category/national/?outputType=xml"
feed = feedparser.parse(rss_url)

# 새로운 RSS 피드 생성
rss = ET.Element('rss', version='2.0')
channel = ET.SubElement(rss, 'channel')
ET.SubElement(channel, 'title').text = "오늘의 운세"
ET.SubElement(channel, 'link').text = "https://www.chosun.com"
ET.SubElement(channel, 'description').text = "오늘의 운세 관련 뉴스"

# '오늘의 운세' 관련 항목 추가
for entry in feed.entries:
    if '오늘의 운세' in entry.title or '운세' in entry.title:
        item = ET.SubElement(channel, 'item')
        ET.SubElement(item, 'title').text = entry.title
        ET.SubElement(item, 'link').text = entry.link
        ET.SubElement(item, 'description').text = entry.description

# 새로 생성된 XML을 파일로 저장
tree = ET.ElementTree(rss)
tree.write("C:/Users/PARKSOHUI/Desktop/filtered_horoscope_feed.xml", encoding="utf-8", xml_declaration=True)
