import requests  # 导入requests包
import json
import os
import time
import uuid

HOST = '192.168.31.33:8011'

class menu:
    today_menu_url = "http://%s/api/v1/menu/todayDrink" % HOST
    order_url = "http://%s/api/v1/menu/addDrinkOrder" % HOST
    faceid_url = "http://192.168.31.33:3001/api/v1/sense/cv/identify"
    get_order_info_path = "../../myfifo/ros_2_frontEnd"
    CONFIG = {'url': order_url, 'headers': {'Content-Type': 'application/json'}}
    today_menu_name_and_id = {}
    receive = []
    is_open = 0
    f = 0

    def __init__(self):
        self.get_today_menu()

    def get_today_menu(self):
        html_str = requests.get(self.today_menu_url)  # 发送Get请求
        today_menu = json.loads(html_str.text)
        print(today_menu["menu"])
        for i in today_menu["menu"]:
            self.today_menu_name_and_id[i['nameCn']] = [i['productId'], i['price']]
        print('打印今天饮料')
        for i in self.today_menu_name_and_id:
            print(i, self.today_menu_name_and_id[i])
        # print(self.today_menu_name_and_id)

    def get_order_from_kevin(self):
        if self.is_open == 0:
            self.f = os.open(self.get_order_info_path, os.O_RDONLY)
            print("Client open f", self.f)
            self.is_open = 1
        self.receive = os.read(self.f, 1024)
        try:
            print('here',str(self.receive, encoding='utf-8'))
            self.receive = json.loads(str(self.receive, encoding='utf-8'))  # 解析json
            return self.receive
        except Exception as e:
            print(e)
            return 0

    def send_order_to_ratio(self, data):
        response = requests.post(url=self.order_url, data=json.dumps(data), headers=self.CONFIG['headers'])
        print("发送给ration后的回应", response.text)
        response = json.loads(response.text)
        if response['errno'] != 0:
            print("error, 下单失败")
            return 1
        return 0

    def __get_faceId(self,faceid):
        try:
            data = {"faceID":faceid}
            response = requests.post(url=self.faceid_url,data=json.dumps(data), headers=self.CONFIG['headers'])
            print("请求faceid后的回应", response.text)
            response = json.loads(response.text)
            if response['errno'] != 0:
                print("请求faceid失败")
                return 0
            return response['customerID']
        except:
            print("请求faceid连接失败")
            return 0
    def parse_data(self):
        # TODO 获得orderID, customerID, createTime, drinkID, cupType, temp, totalPrice
        data = {}
        orderDetail = {}
        now_time = int(time.time()*1000)
        data['orderID'] = str(uuid.uuid1())
        # data['customerID'] = 1  # TODO 暂时不知道从哪获取
        data['createTime'] = now_time
        try:
            print('--------------------------')
            orderDetail['drinkID'] = self.today_menu_name_and_id[self.receive['OrderInfo']['DrinkName']][0]
            print(self.receive['OrderInfo']['CupType'])
            orderDetail['cupType'] = int(self.receive['OrderInfo']['CupType'])
            orderDetail['temp'] = int(self.receive['OrderInfo']['Temp'])
            print(self.receive['name'])
            faceid = self.receive['name'].split('--')[1]
            print('faceid',faceid)
            data['customerID'] = self.__get_faceId(faceid)
            orderDetail['totalPrice'] = self.today_menu_name_and_id[self.receive['OrderInfo']['DrinkName']][1]
            data['orderDetail'] = [orderDetail]*int(self.receive["OrderInfo"]["CupNum"])
            print(data)
            return data
        except Exception as e:
            print("可能当日饮料不包括:%s" % self.receive['OrderInfo']['DrinkName'])
            print(e)
            return 0



