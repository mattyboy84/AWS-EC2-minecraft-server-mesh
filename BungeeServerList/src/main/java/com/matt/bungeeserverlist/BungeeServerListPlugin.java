package com.matt.bungeeserverlist;

import net.md_5.bungee.api.ProxyServer;
import net.md_5.bungee.api.plugin.Plugin;
import net.md_5.bungee.config.Configuration;
import net.md_5.bungee.config.YamlConfiguration;
import net.md_5.bungee.api.config.ServerInfo;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.Set;
import java.util.HashSet;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;   
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

public class BungeeServerListPlugin extends Plugin {
    private final String API_URL = System.getenv("BUNGEE_SERVER_API_URL");

    @Override
    public void onEnable() {
        getLogger().info("BungeeServerList Plugin Enabled!");

        getLogger().info("Listing all environment variables:");
        System.getenv().forEach((key, value) -> getLogger().info(key + " = " + value));

        getLogger().info("API URL: " + API_URL);
        fetchAndUpdateServers();
        scheduleServerUpdates();
    }

    private void scheduleServerUpdates() {
        ProxyServer.getInstance().getScheduler().schedule(this, this::fetchAndUpdateServers, 60, 60, TimeUnit.SECONDS);
    }

    private void fetchAndUpdateServers() {
        try {
            String jsonResponse = fetchApiData(API_URL);
            if (jsonResponse != null) {
                updateBungeeConfig(jsonResponse);
            }
        } catch (Exception e) {
            getLogger().log(Level.SEVERE, "Error updating servers", e);
        }
    }

    private String fetchApiData(String urlString) throws Exception {
        URL url = new URL(urlString);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("GET");
        connection.setRequestProperty("Accept", "application/json");

        InputStream responseStream = connection.getInputStream();
        return new String(responseStream.readAllBytes(), StandardCharsets.UTF_8);
    }

    private void updateBungeeConfig(String jsonResponse) {
        JsonElement element = JsonParser.parseString(jsonResponse);
        if (!element.isJsonArray()) return;

        JsonArray serverArray = element.getAsJsonArray();
        Map<String, ServerInfo> servers = ProxyServer.getInstance().getServers();

        Set<String> newServerNames = new HashSet<>();
        for (JsonElement serverElement : serverArray) {
            JsonObject serverObject = serverElement.getAsJsonObject();
            String name = serverObject.get("name").getAsString();
            String address = serverObject.get("address").getAsString();
            newServerNames.add(name);

            // add new server that wasn't previously in the list response
            if (!servers.containsKey(name)) {
                ServerInfo serverInfo = ProxyServer.getInstance().constructServerInfo(
                    name, 
                    java.net.InetSocketAddress.createUnresolved(address.split(":")[0], Integer.parseInt(address.split(":")[1])), 
                    "Auto-added server", 
                    false
                );
                servers.put(name, serverInfo);
                getLogger().info("Added server: " + name + " -> " + address);
            }
        }

        // remove sever that is no longer in the list response (excluding lobby)
        Set<String> currentServerNames = new HashSet<>(servers.keySet());
        for (String existingServer : currentServerNames) {
            if (!newServerNames.contains(existingServer) && !existingServer.equalsIgnoreCase("lobby")) {
                servers.remove(existingServer);
                getLogger().info("Removed server: " + existingServer);
            }
        }
    }
}
